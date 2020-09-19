const { logRQRS } = require('../../../amadeus/logRQ');

const Amadeus = require('amadeus');
const { amadeusGdsConfig } = require('../../../../config');
const GliderError = require('../../../error');

const REQUESTS = {
  SEARCHOFFERS: 'SEARCHOFFERS',
  PRICEOFFERS: 'PRICEOFFERS',
  ORDERCREATE: 'ORDERCREATE',
  SEATMAP: 'SEATMAP',
};


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


const callProviderRest = async (
  provider,
  apiEndpoint,
  apiKey,
  ndcBody,
  SOAPAction,
) => {
  let response;
  try {
    logRQRS(ndcBody, `${SOAPAction}-request`);
    const amadeusClient = getAmadeusClient();
    if (SOAPAction === 'SEARCHOFFERS')
      response = await amadeusClient.shopping.flightOffersSearch.post(JSON.stringify(ndcBody));
    else if (SOAPAction === 'PRICEOFFERS')
      response = await amadeusClient.shopping.flightOffers.pricing.post(JSON.stringify(ndcBody));
    else if (SOAPAction === 'ORDERCREATE')
      response = await amadeusClient.booking.flightOrders.post(JSON.stringify(ndcBody));
    else if (SOAPAction === 'SEATMAP') {
      response = await amadeusClient.shopping.seatmaps.post(JSON.stringify(ndcBody));
    } else {
      throw new Error('Unknown action:' + SOAPAction);
    }
    logRQRS(ndcBody, `${SOAPAction}-response`);
  } catch (error) {
    logRQRS(error, `${SOAPAction}-error`);
    let defaultErr = {
      'title': 'UNKNOWN ERROR HAS OCCURED',
      'status': 500,
    };

    //extract list of errors from response (or return default - unknown error)
    let errors = (error && error.response && error.response.result && error.response.result.errors) ? error.response.result.errors : [defaultErr];

    return {
      response: {},
      error: errors,
    };
  }
  return {
    response,
  };
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
  callProviderRest,
  REQUESTS,
};
