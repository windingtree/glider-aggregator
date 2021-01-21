const { airFranceConfig } = require('../../../../config');
const { createWebserviceDefinition } = require('../../../webservice/webserviceClient');
const WebserviceClient = require('../../../webservice/webserviceClient').WebserviceClient;

const WEBSERVICES = {
  FLIGHTS_SEARCH: 'FLIGHTS_SEARCH',
  CREATE_ORDER: 'CREATE_ORDER',
  ORDER_FULFILL: 'CREATE_ORDER',
};

const customHeaders = {
  api_key: airFranceConfig.apiKey,
  'X-apiKey': airFranceConfig.apiKey,
};
const WEBSERVICES_CONFIG = [
  createWebserviceDefinition(WEBSERVICES.FLIGHTS_SEARCH, 'https://ndc-rct.airfranceklm.com/passenger/distribmgmt/001448v01/EXT', '"http://www.af-klm.com/services/passenger/ProvideAirShopping/provideAirShopping"', customHeaders),
  createWebserviceDefinition(WEBSERVICES.CREATE_ORDER, 'https://ndc-rct.airfranceklm.com/passenger/distribmgmt/001451v01/EXT', '"http://www.af-klm.com/services/passenger/ProvideOrderCreate/provideOrderCreate"', customHeaders),
  createWebserviceDefinition(WEBSERVICES.ORDER_FULFILL, 'https://ndc-rct.airfranceklm.com/passenger/distribmgmt/001489v01/EXT', '"http://www.af-klm.com/services/passenger/AirDocIssue/airDocIssue"', customHeaders),
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



const createOrderRQ = async (request) => {
  return await getWbsClient().wbsRequest(WEBSERVICES.CREATE_ORDER, request);
};

const fulfillOrderRQ = async (request) => {
  return await getWbsClient().wbsRequest(WEBSERVICES.ORDER_FULFILL, request);
};

module.exports = {
  flightSearchRQ, createOrderRQ, fulfillOrderRQ,
};
