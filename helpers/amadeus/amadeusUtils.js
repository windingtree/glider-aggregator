const { logRQRS } = require('../log/logRQ');

const Amadeus = require('amadeus');
const { amadeusGdsConfig } = require('../../config');
const GliderError = require('../error');

const REQUESTS = {
  SEARCHOFFERS: 'SEARCHOFFERS',
  PRICEOFFERS: 'PRICEOFFERS',
  ORDERCREATE: 'ORDERCREATE',
  SEATMAP: 'SEATMAP',
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


const amadeusEndpointRequest = async (ndcBody, SOAPAction) => {
  let response;
  try {
    logRQRS(ndcBody, `${SOAPAction}-request`);
    const amadeusClient = getAmadeusClient();
    switch (SOAPAction) {
      case REQUESTS.SEARCHOFFERS:
        response = await amadeusClient.shopping.flightOffersSearch.post(JSON.stringify(ndcBody));
        break;
      case REQUESTS.PRICEOFFERS:
        response = await amadeusClient.shopping.flightOffers.pricing.post(JSON.stringify(ndcBody));
        break;
      case REQUESTS.ORDERCREATE:
        response = await amadeusClient.booking.flightOrders.post(JSON.stringify(ndcBody));
        break;
      case REQUESTS.SEATMAP:
        response = await amadeusClient.shopping.seatmaps.post(JSON.stringify(ndcBody));
        break;
      default:
        throw new GliderError(`Unknown webservice call:${SOAPAction}`, 500);
    }
    logRQRS(ndcBody, `${SOAPAction}-response`);
  } catch (error) {
    logRQRS(error, `${SOAPAction}-error`);
    //extract list of errors from response (or return default - unknown error)
    throw new GliderError(error, 500);
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


module.exports = {
  transformAmadeusFault,
  assertAmadeusFault,
  getAmadeusClient,
  amadeusEndpointRequest: amadeusEndpointRequest,
  REQUESTS,
};
