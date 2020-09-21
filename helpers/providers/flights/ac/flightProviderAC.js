const FlightProvider = require('../../flightProvider');
const { flightSearchRQ, offerPriceRQ, createOrderRQ, fulfillOrderRQ, retrieveSeatMapRQ } = require('./ndcClientAC');
const { createFlightSearchRequest, createRetrieveSeatmapRequest, createPriceOffersRequest, createOrderCreateRequest, createFulfillOrderRequest } = require('./requestResponseConverters');
const { processFlightSearchResponse, processSeatmapResponse, processOfferPriceResponse, processOrderCreateResponse, processOrderFulfillmentResponse } = require('./requestResponseConverters');
const { assertResponseErrors } = require('../ndc/assertResponseErrors');


// shopping templates
const {
  ErrorsTransformTemplate_AC: ShoppingErrorsTransformTemplate_AC,
  FaultsTransformTemplate_AC: ShoppingFaultsTransformTemplate_AC,
} = require('./camaroTemplates/shoppingTemplate');

// pricing templates
const {
  FaultsTransformTemplate_AC: OfferPriceFaultsTransformTemplate_AC,
  ErrorsTransformTemplate_AC: OfferPriceErrorsTransformTemplate_AC,
} = require('./camaroTemplates/provideOfferPrice');

//order create templates
const {
  ErrorsTransformTemplate_AC: CreateOfferErrorsTransformTemplate_AC,
  FaultsTransformTemplate_AC: CreateOfferFaultsTransformTemplate_AC,
} = require('./camaroTemplates/provideOrderCreate');

//seatmap templates
const {
  FaultsTransformTemplate_AC: SeatMapFaultsTransformTemplate_AC,
  ErrorsTransformTemplate_AC: SeatMapErrorsTransformTemplate_AC,
} = require('./camaroTemplates/provideSeatAvailability');

//fulfillment templates
const {
  ErrorsTransformTemplate_AC: FulfillErrorsTransformTemplate_AC,
  FaultsTransformTemplate_AC: FulfillFaultsTransformTemplate_AC,
} = require('./camaroTemplates/fulfillOrder');

module.exports = class FlightProviderAC extends FlightProvider {
  constructor () {
    super();
  }

  async flightSearch (itinerary, passengers) {
    let ndcBody = createFlightSearchRequest(itinerary, passengers);
    let response = await flightSearchRQ(ndcBody);
    await assertResponseErrors(response.data, ShoppingErrorsTransformTemplate_AC, ShoppingFaultsTransformTemplate_AC);
    return processFlightSearchResponse(response.data);
  }

  async retrieveSeatmaps (offers) {
    let ndcBody = createRetrieveSeatmapRequest(offers);
    const response = await retrieveSeatMapRQ(ndcBody);
    await assertResponseErrors(response.data, SeatMapFaultsTransformTemplate_AC, SeatMapErrorsTransformTemplate_AC);
    return await processSeatmapResponse(response.data, offers);
  }

  async priceOffers (body, offers) {
    let ndcBody = createPriceOffersRequest(offers, body);
    const response = await offerPriceRQ(ndcBody);
    await assertResponseErrors(response.data, OfferPriceErrorsTransformTemplate_AC, OfferPriceFaultsTransformTemplate_AC);
    return await processOfferPriceResponse(response.data);
  }

  async orderCreate (offer, requestBody, guaranteeClaim) {
    let ndcBody = createOrderCreateRequest(offer, requestBody, guaranteeClaim);
    const response = await createOrderRQ(ndcBody);
    await assertResponseErrors(response.data, CreateOfferErrorsTransformTemplate_AC, CreateOfferFaultsTransformTemplate_AC);
    return await processOrderCreateResponse(response.data);
  }

  async orderFulfill (orderId, order, body, guaranteeClaim) {
    // guaranteeClaim = await claimGuaranteeWithCard(body.guaranteeId);
    let ndcBody = createFulfillOrderRequest(orderId, order, body, guaranteeClaim);
    const response = await fulfillOrderRQ(ndcBody);
    await assertResponseErrors(response.data, FulfillErrorsTransformTemplate_AC, FulfillFaultsTransformTemplate_AC);
    // await ready();
    return await processOrderFulfillmentResponse(response.data);
  }

  getProviderID () {
    return 'AC';
  }
};

