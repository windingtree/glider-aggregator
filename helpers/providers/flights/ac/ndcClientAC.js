const { airCanadaConfig } = require('../../../../config');
const { webserviceDefinition } = require('../../../webservice/webserviceClient');
const WebserviceClient = require('../../../webservice/webserviceClient').WebserviceClient;

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
  webserviceDefinition(WEBSERVICES.FLIGHTS_SEARCH, `${airCanadaConfig.baseUrl}/AirShopping`, undefined, customHeaders),
  webserviceDefinition(WEBSERVICES.SEATMAP_RETRIEVE, `${airCanadaConfig.baseUrlPci}/SeatAvailability`, undefined, customHeaders),
  webserviceDefinition(WEBSERVICES.PRICE_OFFER, `${airCanadaConfig.baseUrl}/OfferPrice`, undefined, customHeaders),
  webserviceDefinition(WEBSERVICES.CREATE_ORDER, `${airCanadaConfig.baseUrlPci}/OrderCreate`, undefined, customHeaders),
  webserviceDefinition(WEBSERVICES.ORDER_FULFILL, `${airCanadaConfig.baseUrlPci}/OrderCreate`, undefined, customHeaders),
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

module.exports = {
  flightSearchRQ, retrieveSeatMapRQ, offerPriceRQ, createOrderRQ, fulfillOrderRQ,
};
