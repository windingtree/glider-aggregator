const { airCanadaConfig } = require('../../../../config');
const { webserviceDefinition } = require('../../../ndcUtils/ndcClient');
const NDCCLient = require('../../../ndcUtils/ndcClient').NDCCLient;

const WEBSERVICES = {
  FLIGHTS_SEARCH: 'FLIGHTS_SEARCH',
  SEATMAP_RETRIEVE: 'SEATMAP_RETRIEVE',
  PRICE_OFFER: 'PRICE_OFFER',
  CREATE_ORDER: 'CREATE_ORDER',
  ORDER_FULFILL: 'CREATE_ORDER',
};

const WEBSERVICES_CONFIG = [
  webserviceDefinition(WEBSERVICES.FLIGHTS_SEARCH, `${airCanadaConfig.baseUrl}/AirShopping`, undefined, airCanadaConfig.apiKey),
  webserviceDefinition(WEBSERVICES.SEATMAP_RETRIEVE, `${airCanadaConfig.baseUrlPci}/SeatAvailability`, undefined, airCanadaConfig.apiKey),
  webserviceDefinition(WEBSERVICES.PRICE_OFFER, `${airCanadaConfig.baseUrl}/OfferPrice`, undefined, airCanadaConfig.apiKey),
  webserviceDefinition(WEBSERVICES.CREATE_ORDER, `${airCanadaConfig.baseUrlPci}/OrderCreate`, undefined, airCanadaConfig.apiKey),
  webserviceDefinition(WEBSERVICES.ORDER_FULFILL, `${airCanadaConfig.baseUrlPci}/OrderCreate`, undefined, airCanadaConfig.apiKey),
];

let ndcClient;

const getNdcClient = () => {
  if (!ndcClient) {
    ndcClient = new NDCCLient(WEBSERVICES_CONFIG);
  }
  return ndcClient;
};

const flightSearchRQ = async (request) => {
  return await getNdcClient().ndcRequest(WEBSERVICES.FLIGHTS_SEARCH, request);
};

const retrieveSeatMapRQ = async (request) => {
  return await getNdcClient().ndcRequest(WEBSERVICES.SEATMAP_RETRIEVE, request);
};

const offerPriceRQ = async (request) => {
  return await getNdcClient().ndcRequest(WEBSERVICES.PRICE_OFFER, request);
};

const createOrderRQ = async (request) => {
  return await getNdcClient().ndcRequest(WEBSERVICES.CREATE_ORDER, request);
};

const fulfillOrderRQ = async (request) => {
  return await getNdcClient().ndcRequest(WEBSERVICES.ORDER_FULFILL, request);
};

module.exports = {
  flightSearchRQ, retrieveSeatMapRQ, offerPriceRQ, createOrderRQ, fulfillOrderRQ,
};
