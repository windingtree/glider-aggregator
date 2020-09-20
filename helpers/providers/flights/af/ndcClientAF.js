const { airFranceConfig } = require('../../../../config');
const { webserviceDefinition } = require('../../../ndcUtils/ndcClient');
const NDCCLient = require('../../../ndcUtils/ndcClient').NDCCLient;

const WEBSERVICES = {
  FLIGHTS_SEARCH: 'FLIGHTS_SEARCH',
  CREATE_ORDER: 'CREATE_ORDER',
  ORDER_FULFILL: 'CREATE_ORDER',
};

const WEBSERVICES_CONFIG = [
  webserviceDefinition(WEBSERVICES.FLIGHTS_SEARCH, 'https://ndc-rct.airfranceklm.com/passenger/distribmgmt/001448v01/EXT', '"http://www.af-klm.com/services/passenger/ProvideAirShopping/provideAirShopping"', airFranceConfig.apiKey),
  webserviceDefinition(WEBSERVICES.CREATE_ORDER, 'https://ndc-rct.airfranceklm.com/passenger/distribmgmt/001451v01/EXT', '"http://www.af-klm.com/services/passenger/ProvideOrderCreate/provideOrderCreate"', airFranceConfig.apiKey),
  webserviceDefinition(WEBSERVICES.ORDER_FULFILL, 'https://ndc-rct.airfranceklm.com/passenger/distribmgmt/001489v01/EXT', '"http://www.af-klm.com/services/passenger/AirDocIssue/airDocIssue"', airFranceConfig.apiKey),
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



const createOrderRQ = async (request) => {
  return await getNdcClient().ndcRequest(WEBSERVICES.CREATE_ORDER, request);
};

const fulfillOrderRQ = async (request) => {
  return await getNdcClient().ndcRequest(WEBSERVICES.ORDER_FULFILL, request);
};

module.exports = {
  flightSearchRQ, createOrderRQ, fulfillOrderRQ,
};
