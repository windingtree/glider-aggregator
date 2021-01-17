const { airCanadaConfig } = require('../../../../config');
const { createWebserviceDefinition, WebserviceClient } = require('../../../webservice/webserviceClient');
const { WebserviceCallException } = require('../../../webservice/webserviceException');
const { CustomError1, CustomError2, CustomError3 } = require('../../../webservice/errors');
const GliderError = require('../../../error');

const WEBSERVICES = {
  FLIGHTS_SEARCH: 'FLIGHTS_SEARCH',
  SEATMAP_RETRIEVE: 'SEATMAP_RETRIEVE',
  PRICE_OFFER: 'PRICE_OFFER',
  CREATE_ORDER: 'CREATE_ORDER',
  ORDER_FULFILL: 'CREATE_ORDER',
};
const customHeaders = {
  api_key: airCanadaConfig.apiKey,
  'X-apiKey': airCanadaConfig.apiKey,
};
const WEBSERVICES_CONFIG = [
  createWebserviceDefinition(WEBSERVICES.FLIGHTS_SEARCH, `${airCanadaConfig.baseUrl}/AirShopping`, undefined, customHeaders),
  createWebserviceDefinition(WEBSERVICES.SEATMAP_RETRIEVE, `${airCanadaConfig.baseUrlPci}/SeatAvailability`, undefined, customHeaders),
  createWebserviceDefinition(WEBSERVICES.PRICE_OFFER, `${airCanadaConfig.baseUrl}/OfferPrice`, undefined, customHeaders),
  createWebserviceDefinition(WEBSERVICES.CREATE_ORDER, `${airCanadaConfig.baseUrlPci}/OrderCreate`, undefined, customHeaders),
  createWebserviceDefinition(WEBSERVICES.ORDER_FULFILL, `${airCanadaConfig.baseUrlPci}/OrderCreate`, undefined, customHeaders),
];

let wbsClient;

const getWbsClient = () => {
  if (!wbsClient) {
    wbsClient = new WebserviceClient(WEBSERVICES_CONFIG);
  }
  return wbsClient;
};

const flightSearchRQ = async (request) => {
  return await getWbsClient().wbsRequest(WEBSERVICES.FLIGHTS_SEARCH, request);
};

const retrieveSeatMapRQ = async (request) => {
  return await getWbsClient().wbsRequest(WEBSERVICES.SEATMAP_RETRIEVE, request);
};

const offerPriceRQ = async (request) => {
  return await getWbsClient().wbsRequest(WEBSERVICES.PRICE_OFFER, request);
};

const createOrderRQ = async (request) => {
  return await getWbsClient().wbsRequest(WEBSERVICES.CREATE_ORDER, request);
};

const fulfillOrderRQ = async (request) => {
  return await getWbsClient().wbsRequest(WEBSERVICES.ORDER_FULFILL, request);
};


const translateWebserviceError = (error) => {
  console.log('Error=>', error, 'serverResponse null?', error.serverResponse===undefined);
  if(error instanceof CustomError1)
    console.log('error is CustomError1', error);
  if(error instanceof CustomError2)
    console.log('error is CustomError2', error);
  if(error instanceof CustomError3)
    console.log('error is CustomError3', error);
  if(error instanceof WebserviceCallException)
    console.log('error is WebserviceCallException', error);
  if(error instanceof GliderError)
    console.log('error is GliderError', error);
  if(error instanceof Error)
    console.log('error is Error', error);

  if (error instanceof WebserviceCallException){
    console.log('its WebserviceCallException');
    return new GliderError(error.message, error.httpStatus);
  }else if (error instanceof GliderError) {
    console.log('its GliderError');
    return error;
  }else if (error instanceof Error) {
    console.log('its Error');
    return error;
  }else{
    console.log('unknown error');
    return new GliderError(`Unknown error: ${error.message}, ${error.code}`);
  }
};

module.exports = {
  flightSearchRQ, retrieveSeatMapRQ, offerPriceRQ, createOrderRQ, fulfillOrderRQ,
};
