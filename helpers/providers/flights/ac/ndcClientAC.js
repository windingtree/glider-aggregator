const { airCanadaConfig } = require('../../../../config');
const { createWebserviceDefinition, WebserviceClient } = require('../../../webservice/webserviceClient');

//webservices identifiers (must be unique and point to a specific definition which is created later)
const WEBSERVICES = {
  FLIGHTS_SEARCH: 'FLIGHTS_SEARCH',
  SEATMAP_RETRIEVE: 'SEATMAP_RETRIEVE',
  PRICE_OFFER: 'PRICE_OFFER',
  CREATE_ORDER: 'CREATE_ORDER',
  ORDER_FULFILL: 'CREATE_ORDER',
};
//custom headers that should be used with AirCanada
const customHeaders = {
  api_key: airCanadaConfig.apiKey,
  'X-apiKey': airCanadaConfig.apiKey,
};

//webservices definitions
const WEBSERVICES_CONFIG = [
  createWebserviceDefinition(WEBSERVICES.FLIGHTS_SEARCH, `${airCanadaConfig.baseUrl}/AirShopping`, undefined, customHeaders),
  createWebserviceDefinition(WEBSERVICES.SEATMAP_RETRIEVE, `${airCanadaConfig.baseUrlPci}/SeatAvailability`, undefined, customHeaders),
  createWebserviceDefinition(WEBSERVICES.PRICE_OFFER, `${airCanadaConfig.baseUrl}/OfferPrice`, undefined, customHeaders),
  createWebserviceDefinition(WEBSERVICES.CREATE_ORDER, `${airCanadaConfig.baseUrlPci}/OrderCreate`, undefined, customHeaders),
  createWebserviceDefinition(WEBSERVICES.ORDER_FULFILL, `${airCanadaConfig.baseUrlPci}/OrderCreate`, undefined, customHeaders),
];

let wbsClient;

//create webservice client instance, configure it with available webservices definitions
const getWbsClient = () => {
  if (!wbsClient) {
    wbsClient = new WebserviceClient(WEBSERVICES_CONFIG);
  }
  return wbsClient;
};

//search for flights
const flightSearchRQ = async (request) => {
  return await getWbsClient().wbsRequest(WEBSERVICES.FLIGHTS_SEARCH, request);
};

//retrieve seatmap
const retrieveSeatMapRQ = async (request) => {
  return await getWbsClient().wbsRequest(WEBSERVICES.SEATMAP_RETRIEVE, request);
};

//price offer
const offerPriceRQ = async (request) => {
  return await getWbsClient().wbsRequest(WEBSERVICES.PRICE_OFFER, request);
};

//create an order
const createOrderRQ = async (request) => {
  return await getWbsClient().wbsRequest(WEBSERVICES.CREATE_ORDER, request);
};

//issue a ticket
const fulfillOrderRQ = async (request) => {
  return await getWbsClient().wbsRequest(WEBSERVICES.ORDER_FULFILL, request);
};

module.exports = {
  flightSearchRQ, retrieveSeatMapRQ, offerPriceRQ, createOrderRQ, fulfillOrderRQ,
};
