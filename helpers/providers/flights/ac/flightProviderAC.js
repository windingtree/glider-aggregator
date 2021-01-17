const FlightProvider = require('../../flightProvider');
const ndcClient = require('./ndcClientAC');
const converters = require('./requestResponseConverters');
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

class FlightProviderAC extends FlightProvider {
  constructor () {
    super();
  }

  async flightSearch (itinerary, passengers) {
    let ndcBody = converters.createFlightSearchRequest(itinerary, passengers);
    let response = await ndcClient.flightSearchRQ(ndcBody);
    await assertResponseErrors(response.data, ShoppingErrorsTransformTemplate_AC, ShoppingFaultsTransformTemplate_AC);
    return converters.processFlightSearchResponse(response.data);
  }

  async retrieveSeatmaps (offers) {
    let ndcBody = converters.createRetrieveSeatmapRequest(offers);
    const response = await ndcClient.retrieveSeatMapRQ(ndcBody);
    await assertResponseErrors(response.data, SeatMapFaultsTransformTemplate_AC, SeatMapErrorsTransformTemplate_AC);
    return await converters.processSeatmapResponse(response.data, offers);
  }

  async priceOffers (body, offers) {
    let ndcBody = converters.createPriceOffersRequest(offers, body);
    const response = await ndcClient.offerPriceRQ(ndcBody);
    await assertResponseErrors(response.data, OfferPriceErrorsTransformTemplate_AC, OfferPriceFaultsTransformTemplate_AC);
    return await converters.processOfferPriceResponse(response.data);
  }

  async orderCreate (offer, requestBody, guaranteeClaim) {
    let ndcBody = converters.createOrderCreateRequest(offer, requestBody, guaranteeClaim);
    const response = await ndcClient.createOrderRQ(ndcBody);
    await assertResponseErrors(response.data, CreateOfferErrorsTransformTemplate_AC, CreateOfferFaultsTransformTemplate_AC);
    return await converters.processOrderCreateResponse(response.data);
  }

  async orderFulfill (orderId, order, body, guaranteeClaim) {
    // guaranteeClaim = await claimGuaranteeWithCard(body.guaranteeId);
    let ndcBody = converters.createFulfillOrderRequest(orderId, order, body, guaranteeClaim);
    const response = await ndcClient.fulfillOrderRQ(ndcBody);
    await assertResponseErrors(response.data, FulfillErrorsTransformTemplate_AC, FulfillFaultsTransformTemplate_AC);
    // await ready();
    return await converters.processOrderFulfillmentResponse(response.data);
  }

  getProviderID () {
    return 'AC';
  }
};


module.exports = { FlightProviderAC };
