
const Amadeus = require('amadeus');
const { amadeusGdsConfig } = require('../../../../config');
const { GliderError } = require('../../../error');

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


const amadeusRequest = async (request, action) => {
  let response;

  try {
    const amadeusClient = getAmadeusClient();
    if (action === 'SEARCH')
      response = await amadeusClient.shopping.hotelOffers.get(request);
    else if (action === 'ORDER')
      response = await amadeusClient.booking.hotelBookings.post(JSON.stringify(request));
    else
      throw new GliderError('unknown action' + action);
  } catch (error) {
    let defaultErr = {
      'title': 'UNKNOWN ERROR HAS OCCURRED',
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
    response: response,
    error: {},
  };
};


module.exports = {
  amadeusRequest: amadeusRequest,
};
