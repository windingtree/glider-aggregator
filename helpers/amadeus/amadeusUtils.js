const { logRQRS } = require('../log/logRQ');
const _ = require('lodash');
const { AmadeusClient } = require('./amadeusClient');
const { amadeusGdsConfig, amadeusSelfServiceConfig } = require('../../config');
const GliderError = require('../error');


const REQUESTS = {
  SEARCHOFFERS: 'SEARCHOFFERS',
  PRICEOFFERS: 'PRICEOFFERS',
  ORDERCREATE: 'ORDERCREATE',
  ORDERRETRIEVE: 'ORDER_RETRIEVE',
  SEATMAP: 'SEATMAP',
  HOTEL_SEARCH: 'HOTEL_SEARCH',
  HOTEL_ORDER_CREATE: 'HOTEL_ORDER_CREATE',
};

const CLIENT_TYPE_SELF_SERVICE = 'selfservice';
const CLIENT_TYPE_ENTERPRISE = 'enterprise';

/**
 * Create, configure and return instance of amadeus client.
 * Since we need to have two clients (Amadeus Enterprise for flights and Self Service for hotels), we need to maintain two separately.
 * @returns {} Singleton instance of Amadeus client.
 */

let amadeusClients = {
  CLIENT_TYPE_SELF_SERVICE: undefined,
  CLIENT_TYPE_ENTERPRISE: undefined,
};
const getAmadeusClient = (type = CLIENT_TYPE_SELF_SERVICE) => {
  console.log(`getAmadeusClient:${type}`);
  if (amadeusClients[type]) {
    return amadeusClients[type];
  }
  if (type === CLIENT_TYPE_ENTERPRISE) {
    amadeusClients[type] = new AmadeusClient(amadeusGdsConfig.hostname, amadeusGdsConfig.clientId, amadeusGdsConfig.clientSecret);
  } else if (type === CLIENT_TYPE_SELF_SERVICE) {
    amadeusClients[type] = new AmadeusClient(amadeusSelfServiceConfig.hostname, amadeusSelfServiceConfig.clientId, amadeusSelfServiceConfig.clientSecret);
  } else {
    throw new GliderError('Unknown amadeus client type requested:' + type);
  }
  return amadeusClients[type];
};


const amadeusEndpointRequest = async (ndcBody, action, params) => {
  let response;
  let amadeusClient;

  try {
    logRQRS(ndcBody, `${action}-request`);
    switch (action) {
      case REQUESTS.SEARCHOFFERS:
        amadeusClient = getAmadeusClient(CLIENT_TYPE_ENTERPRISE);
        response = await amadeusClient.doPost('/v2/shopping/flight-offers', ndcBody, params);
        // response = await amadeusClient.shopping.flightOffersSearch.post(requestStr);
        break;
      case REQUESTS.PRICEOFFERS:
        amadeusClient = getAmadeusClient(CLIENT_TYPE_ENTERPRISE);
        response = await amadeusClient.doPost('/v1/shopping/flight-offers/pricing', ndcBody, params);
        // response = await amadeusClient.shopping.flightOffers.pricing.post(requestStr);
        break;
      case REQUESTS.ORDERCREATE:
        amadeusClient = getAmadeusClient(CLIENT_TYPE_ENTERPRISE);
        response = await amadeusClient.doPost('/v1/booking/flight-orders?issue=true', ndcBody, params);
        // response = await amadeusClient.booking.flightOrders.post(requestStr);
        break;
      case REQUESTS.ORDERRETRIEVE:

        amadeusClient = getAmadeusClient(CLIENT_TYPE_ENTERPRISE);
        response = await amadeusClient.doGet(`/v1/booking/flight-orders/${ndcBody.orderId}`, params);
        // response = await amadeusClient.doGet(`/v1/booking/flight-orders/by-reference?${queryString}`);
        break;
      case REQUESTS.SEATMAP:
        amadeusClient = getAmadeusClient(CLIENT_TYPE_ENTERPRISE);
        response = await amadeusClient.doPost('/v2/shopping/flight-offers', ndcBody,params);
        // response = await amadeusClient.shopping.seatmaps.post(requestStr);
        break;
      case REQUESTS.HOTEL_SEARCH:
        amadeusClient = getAmadeusClient(CLIENT_TYPE_SELF_SERVICE);

        response = await amadeusClient.doGet('/v2/shopping/hotel-offers', ndcBody, params);
        // response = await amadeusClient.shopping.hotelOffers.get(ndcBody);
        break;
      case REQUESTS.HOTEL_ORDER_CREATE:
        amadeusClient = getAmadeusClient(CLIENT_TYPE_SELF_SERVICE);
        response = await amadeusClient.doPost('/v1/booking/hotel-bookings', ndcBody,params);
        // response = await amadeusClient.booking.hotelBookings.post(requestStr);
        break;
    }
    response = response.data;
    logRQRS(response, `${action}-response`);
  } catch (error) {
    logRQRS(error, `${action}-error`);
    let errors = _.get(error, 'response.data.errors');
    let errorMessage;
    if (errors && Array.isArray(errors)) {
      errorMessage = errors.map(err => `${err.title ? err.title : ''};${err.detail ? err.detail : ''}`).join(',');
    }
    throw new GliderError(errorMessage ? errorMessage : error.message, 500);
  }
  return response;
};


const transformAmadeusFault = (result) => {
  let errors = [];
  if (result && result.errors) {
    errors = result.errors.map(error => {
      return { message: error.title, code: error.code, type: error.status };
    });
  }
  return {
    errors: errors,
  };
};

// Look for all types of response errors
const assertAmadeusFault = (response, error) => {
  if (error) {
    let message = error.map(e => e.title).join(';');
    throw new GliderError(message, 502);
  }
};


const flightOffersSearch = async (request, params) => {
  return await amadeusEndpointRequest(request, REQUESTS.SEARCHOFFERS, params);
};

const seatmapRequest = async (request, params) => {
  return await amadeusEndpointRequest(request, REQUESTS.SEATMAP, params);
};

const flightOfferPrice = async (request, params) => {
  return await amadeusEndpointRequest(request, REQUESTS.PRICEOFFERS, params);
};

const flightOrderCreate = async (request, params) => {
  return await amadeusEndpointRequest(request, REQUESTS.ORDERCREATE, params);
};

const flightOrderRetrieve = async (request, params) => {
  return await amadeusEndpointRequest(request, REQUESTS.ORDERRETRIEVE, params);
};


const hotelSearch = async (request) => {
  return await amadeusEndpointRequest(request, REQUESTS.HOTEL_SEARCH);
};

const hotelBook = async (request) => {
  return await amadeusEndpointRequest(request, REQUESTS.HOTEL_ORDER_CREATE);
};

module.exports = {
  transformAmadeusFault,
  assertAmadeusFault,
  getAmadeusClient,
  amadeusEndpointRequest,
  flightOffersSearch,
  seatmapRequest,
  flightOfferPrice,
  flightOrderCreate,
  flightOrderRetrieve,
  hotelSearch,
  hotelBook,
};
