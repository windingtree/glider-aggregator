const FlightProvider = require('../../flightProvider');

const { createFlightSearchRequest, processFlightSearchResponse } = require('./resolvers/searchOffersRequestResponseConverters');
const { assertAmadeusFault } = require('../../../amadeus/amadeusUtils');
const amadeusClient = require('../../../amadeus/amadeusUtils');

const { createOfferPriceRequest, processPriceOfferResponse } = require('./resolvers/priceOfferRequestResponseConverters');
const { orderCreateResponseProcessor, createOrderCreateRequest, orderRetrieveResponseConverter } = require('./resolvers/orderCreateRequestResponseConverters');
const { processRetrieveSeatmapResponse, createRetrieveSeatmapRequest } = require('./resolvers/seatmapRequestResponseConverters');
const GliderError = require('../../../error');
const { getFeatureFlag } = require('../../../../config');


class FlightProvider1A extends FlightProvider {
  constructor () {
    super();
  }

  async flightSearch (itinerary, passengers) {
    const request = createFlightSearchRequest(itinerary, passengers);
    const response = await amadeusClient.flightOffersSearch(request);
    assertAmadeusFault(response);
    return processFlightSearchResponse(response.data);
  }


  // eslint-disable-next-line no-unused-vars
  async retrieveSeatmaps (offers) {
    let seatmapEnabled = getFeatureFlag('flights.amadeus.seatmap.enabled');
    if (!seatmapEnabled)
      throw new GliderError('Seatmap display for this flight is not possible');   //for now we will not display seatmap for Amadeus
    let ndcBody = createRetrieveSeatmapRequest(offers);
    const response = await amadeusClient.seatmapRequest(ndcBody);
    assertAmadeusFault(response);
    return processRetrieveSeatmapResponse(response.result, offers);
  }

  async priceOffers (body, offers) {
    let priceRQ = createOfferPriceRequest(offers.map(offer => offer.extraData.rawOffer));
    let response;
    try {
      response = await amadeusClient.flightOfferPrice(priceRQ);
      assertAmadeusFault(response);
    } catch (err) {
      console.log('Error while trying to price an offer:', err);
      response = await amadeusClient.flightOfferPrice(priceRQ);
      assertAmadeusFault(response);
    }
    return processPriceOfferResponse(response);
  }

  async orderCreate (offer, requestBody, guaranteeClaim) {
    // create request
    let request = createOrderCreateRequest(offer, requestBody, guaranteeClaim);
    let order;
    try {
      //make a call to Amadeus to create an order
      let orderCreateResponse = await amadeusClient.flightOrderCreate(request);
      // process any potential errors
      assertAmadeusFault(orderCreateResponse);

      //convert to WT format
      order = orderCreateResponseProcessor(orderCreateResponse);

      //since response from order create does not contain eTicket numbers, we need to make a separate call to retrieve orders
      let eTickets = [];
      let pnrRetrieveQuery = {
        orderId: orderCreateResponse.data.id,
      };
      //retrieve an order
      let orderRetrieveResponse = await amadeusClient.flightOrderRetrieve(pnrRetrieveQuery);
      //convert response
      let retrievedOrder = orderRetrieveResponseConverter(orderRetrieveResponse);
      //extract eTicket numbers
      if (retrievedOrder && retrievedOrder.travelDocuments && retrievedOrder.travelDocuments.etickets) {
        eTickets.push(...retrievedOrder.travelDocuments.etickets);
      }

      //remove dupes
      let eTicketsSet = new Set(eTickets);
      eTickets = [...eTicketsSet];

      //store eTickets in the response from order create
      order.travelDocuments.etickets = eTickets;
    } catch (err) {
      console.error(err);
      throw new GliderError('Failure while creating booking:' + err, 500);
    }

    return order;
  }

  // eslint-disable-next-line no-unused-vars
  async orderFulfill (orderId, order, body, guaranteeClaim) {
    throw new Error('Not implemented');
  }

  getProviderID () {
    return 'AMADEUS';
  }
};

module.exports = { FlightProvider1A };
