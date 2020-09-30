const { logRQRS } = require('../log/logRQ');
const _ = require('lodash');
const Amadeus = require('amadeus');
const { amadeusGdsConfig } = require('../../config');
const GliderError = require('../error');

const REQUESTS = {
  SEARCHOFFERS: 'SEARCHOFFERS',
  PRICEOFFERS: 'PRICEOFFERS',
  ORDERCREATE: 'ORDERCREATE',
  SEATMAP: 'SEATMAP',
  HOTEL_SEARCH: 'HOTEL_SEARCH',
  HOTEL_ORDER_CREATE: 'HOTEL_ORDER_CREATE',
};

/**
 * Create, configure and return instance of amadeus client.
 * @returns {} Singleton instance of Amadeus client.
 */

const getAmadeusClient = () => {
  let amadeusClient;
  if (amadeusClient) {
    return amadeusClient;
  }
  amadeusClient = new Amadeus({
    clientId: amadeusGdsConfig.clientId,
    clientSecret: amadeusGdsConfig.clientSecret,
    hostname: amadeusGdsConfig.hostname,
  });
  return amadeusClient;
};


const amadeusEndpointRequest = async (ndcBody, action) => {
  let response;
  try {
    logRQRS(ndcBody, `${action}-request`);
    const amadeusClient = getAmadeusClient();
    let requestStr = JSON.stringify(ndcBody);
    switch (action) {
      case REQUESTS.SEARCHOFFERS:
        response = await amadeusClient.shopping.flightOffersSearch.post(requestStr);
        break;
      case REQUESTS.PRICEOFFERS:
        response = await amadeusClient.shopping.flightOffers.pricing.post(requestStr);
        break;
      case REQUESTS.ORDERCREATE:
        response = await amadeusClient.booking.flightOrders.post(requestStr);
        break;
      case REQUESTS.SEATMAP:
        response = await amadeusClient.shopping.seatmaps.post(requestStr);
        break;
      case REQUESTS.HOTEL_SEARCH:
        response = await amadeusClient.shopping.hotelOffers.get(ndcBody);
        break;
      case REQUESTS.HOTEL_ORDER_CREATE:
        response = await amadeusClient.booking.hotelBookings.post(requestStr);
        break;
    }
    logRQRS(response, `${action}-response`);
  } catch (error) {
    logRQRS(error, `${action}-error`);
    let errorMessage = 'Unknown error occurred'; //default error message
    let errors = _.get(error, 'response.result.errors');
    if (errors)
      errorMessage = errors.map(err => err.title);
    throw new GliderError(errorMessage, 500);
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


const flightOffersSearch = async (request) => {
  return await amadeusEndpointRequest(request, REQUESTS.SEARCHOFFERS);
};

const seatmapRequest = async (request) => {
  return await amadeusEndpointRequest(request, REQUESTS.SEATMAP);
};

const flightOfferPrice = async (request) => {
  return await amadeusEndpointRequest(request, REQUESTS.PRICEOFFERS);
};

const flightOrderCreate = async (request) => {
  return await amadeusEndpointRequest(request, REQUESTS.ORDERCREATE);
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
  hotelSearch,
  hotelBook
};
