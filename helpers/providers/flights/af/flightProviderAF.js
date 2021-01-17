const FlightProvider = require('../../flightProvider');
const converters = require('./requestResponseConverters');

const ndcClient= require('./ndcClientAF');
const { assertResponseErrors } = require('../ndc/assertResponseErrors');

//shopping templates
const { ErrorsTransformTemplate_AF } = require('./camaroTemplates/shoppingTemplate');

//order create templates
const { ErrorsTransformTemplate_AF: OrderCreateErrorsTransformTemplate_AF } = require('./camaroTemplates/provideOrderCreate');


//fulfill order templates
const { ErrorsTransformTemplate_AF: FulfillErrorsTransformTemplate_AF } = require('./camaroTemplates/fulfillOrder');


class FlightProviderAF extends FlightProvider {
  constructor () {
    super();
  }

  async flightSearch (itinerary, passengers) {
    let ndcBody = converters.createFlightSearchRequest(itinerary, passengers);
    let response = await ndcClient.flightSearchRQ(ndcBody);
    await assertResponseErrors(response.data, ErrorsTransformTemplate_AF);
    return converters.processFlightSearchResponse(response.data);
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
    let ndcBody = converters.createOrderCreateRequest(offer, requestBody);
    const response = await ndcClient.createOrderRQ(ndcBody);
    await assertResponseErrors(response.data, OrderCreateErrorsTransformTemplate_AF);
    // Otherwise parse as a result
    return await converters.processOrderCreateResponse(response.data);
  }

  // eslint-disable-next-line no-unused-vars
  async orderFulfill (orderId, order, body, guaranteeClaim) {
    let ndcBody = converters.createFulfillOrderRequest(body, orderId);
    const response = await ndcClient.fulfillOrderRQ(ndcBody);
    await assertResponseErrors(response.data, FulfillErrorsTransformTemplate_AF);

    // await ready();
    return await converters.processFulfillOrderResponse(response.data);
  }

  getProviderID () {
    return 'AF';
  }
};

module.exports = { FlightProviderAF };
