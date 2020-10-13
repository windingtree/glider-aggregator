const { transform } = require('camaro');
const { airFranceConfig } = require('../../../../config');

//shopping templates
const { mapNdcRequestData_AF } = require('./transformInputData/searchOffers');
const { provideShoppingRequestTemplate_AF } = require('./soapTemplates/searchOffers');
const { provideAirShoppingTransformTemplate_AF } = require('./camaroTemplates/shoppingTemplate');

//order create templates
const { mapNdcRequestData_AF: mapNdcOrderCreateRequestData_AF } = require('../ac/transformInputData/createOrder');
const { orderCreateRequestTemplate_AF } = require('./soapTemplates/createOrder');
const { provideOrderCreateTransformTemplate_AF } = require('./camaroTemplates/provideOrderCreate');


//fulfill order templates
const { mapNdcRequestData_AF: mapNdcFulfillRequestData_AF } = require('./transformInputData/fulfillOrder');
const { fulfillOrderTemplate_AF } = require('./soapTemplates/fulfillOrder');
const { fulfillOrderTransformTemplate_AF } = require('./camaroTemplates/fulfillOrder');


const { reMapPassengersInRequestBody } = require('../../../resolvers/utils/flightUtils');


//flight search
const createFlightSearchRequest = (itinerary, passengers) => {
  let ndcRequestData = mapNdcRequestData_AF(airFranceConfig, itinerary, passengers);
  return provideShoppingRequestTemplate_AF(ndcRequestData);
};

const processFlightSearchResponse = async (data) => {
  return await transform(data, provideAirShoppingTransformTemplate_AF);
};

//order create
const createOrderCreateRequest = (offer, requestBody) => {
  requestBody = reMapPassengersInRequestBody(offer, requestBody);
  let ndcRequestData = mapNdcOrderCreateRequestData_AF(airFranceConfig, requestBody);
  return orderCreateRequestTemplate_AF(ndcRequestData);
};

const processOrderCreateResponse = async (data) => {
  return await transform(data, provideOrderCreateTransformTemplate_AF);
};


//fulfillment
const createFulfillOrderRequest = (body, orderId) => {
  let ndcRequestData = mapNdcFulfillRequestData_AF(airFranceConfig, body, orderId);
  return fulfillOrderTemplate_AF(ndcRequestData);
};

const processFulfillOrderResponse = async (data) => {
  return await transform(data, fulfillOrderTransformTemplate_AF);
};

module.exports = {
  createFlightSearchRequest,
  createFulfillOrderRequest,
  createOrderCreateRequest,
  processFlightSearchResponse,
  processOrderCreateResponse,
  processFulfillOrderResponse,
};
