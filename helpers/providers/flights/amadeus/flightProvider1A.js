const FlightProvider = require('../../flightProvider');

const { createFlightSearchRequest, processFlightSearchResponse } = require('./resolvers/searchOffersRequestResponseConverters');
const { amadeusEndpointRequest, REQUESTS, assertAmadeusFault } = require('../../../amadeus/amadeusUtils');

const { createOfferPriceRequest, processPriceOfferResponse } = require('./resolvers/priceOfferRequestResponseConverters');

const { orderCreateResponseProcessor, createOrderCreateRequest } = require('./resolvers/orderCreateRequestResponseConverters');

const { processRetrieveSeatmapResponse, createRetrieveSeatmapRequest } = require('./resolvers/seatmapRequestResponseConverters');


module.exports = class FlightProvider1A extends FlightProvider {
  constructor () {
    super();
  }

  async flightSearch (itinerary, passengers) {
    const request = createFlightSearchRequest(itinerary, passengers);
    const response = await amadeusEndpointRequest(request, REQUESTS.SEARCHOFFERS);
    assertAmadeusFault(response);
    return processFlightSearchResponse(response.data);
  }

  async retrieveSeatmaps (offers) {
    let ndcBody = createRetrieveSeatmapRequest(offers);
    const response = await amadeusEndpointRequest(ndcBody, REQUESTS.SEATMAP);
    assertAmadeusFault(response);
    return processRetrieveSeatmapResponse(response.result, offers);
  }

  async priceOffers (body, offers) {
    let priceRQ = createOfferPriceRequest(offers.map(offer => offer.extraData.rawOffer));
    const response = await amadeusEndpointRequest(priceRQ, REQUESTS.PRICEOFFERS);
    assertAmadeusFault(response);
    return processPriceOfferResponse(response.result);
  }

  async orderCreate (offer, requestBody, guaranteeClaim) {
    // create request
    let request = createOrderCreateRequest(offer, requestBody, guaranteeClaim);
    //make a call
    const response = await amadeusEndpointRequest(request, REQUESTS.ORDERCREATE);
    // process any potential errors
    assertAmadeusFault(response);
    // Otherwise parse as a result
    return orderCreateResponseProcessor(response.result);
  }

  // eslint-disable-next-line no-unused-vars
  async orderFulfill (orderId, order, body, guaranteeClaim) {
    throw new Error('Not implemented');
  }

  getProviderID () {
    return '1A';
  }
};
