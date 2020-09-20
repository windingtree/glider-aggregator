const FlightProviderNDCCommon = require('../ndc/flightProviderNDCCommon');
const { createFlightSearchRequest, createFulfillOrderRequest, createOrderCreateRequest } = require('./requestResponseConverters');
const { processFlightSearchResponse, processFulfillOrderResponse, processOrderCreateResponse } = require('./requestResponseConverters');

const { flightSearchRQ, fulfillOrderRQ, createOrderRQ } = require('./ndcClientAF');
const { assertResponseErrors } = require('../ndc/assertResponseErrors');

//shopping templates
const { ErrorsTransformTemplate_AF } = require('./camaroTemplates/shoppingTemplate');

//order create templates
const { ErrorsTransformTemplate_AF: OrderCreateErrorsTransformTemplate_AF } = require('./camaroTemplates/provideOrderCreate');


//fulfill order templates
const { ErrorsTransformTemplate_AF: FulfillErrorsTransformTemplate_AF } = require('./camaroTemplates/fulfillOrder');


module.exports = class FlightProviderAF extends FlightProviderNDCCommon {
  constructor () {
    super();
  }

  async flightSearch (itinerary, passengers) {
    let ndcBody = createFlightSearchRequest(itinerary, passengers);
    let response = await flightSearchRQ(ndcBody);
    await assertResponseErrors(response.data, ErrorsTransformTemplate_AF);
    return processFlightSearchResponse(response.data);
  }

  // eslint-disable-next-line no-unused-vars
  async priceOffers (body, offers) {
    throw new Error('Not implemented');
  }

  // eslint-disable-next-line no-unused-vars
  async retrieveSeatmaps (offers) {
    throw new Error('Not implemented');
  }

  // eslint-disable-next-line no-unused-vars
  async orderCreate (offer, requestBody, guaranteeClaim) {
    let ndcBody = createOrderCreateRequest(offer, requestBody);
    const response = await createOrderRQ(ndcBody);
    await assertResponseErrors(response.data, OrderCreateErrorsTransformTemplate_AF);
    // Otherwise parse as a result
    return await processOrderCreateResponse(response.data);
  }

  // eslint-disable-next-line no-unused-vars
  async orderFulfill (orderId, order, body, guaranteeClaim) {
    let ndcBody = createFulfillOrderRequest(body, orderId);
    const response = await fulfillOrderRQ(ndcBody);
    await assertResponseErrors(response.data, FulfillErrorsTransformTemplate_AF);

    // await ready();
    return await processFulfillOrderResponse(response.data);
  }

  getProviderID () {
    return 'AF';
  }
};

