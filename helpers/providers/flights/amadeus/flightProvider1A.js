const FlightProvider = require('../../flightProvider');

const amadeusClient = require('../../../amadeus/amadeusUtils');
const amadeusConverters = require('./converters/amadeusConverters');
const GliderError = require('../../../error');
const { getConfigKey } = require('../../../../config');


class FlightProvider1A extends FlightProvider {
  constructor () {
    super();
  }

  async flightSearch (itinerary, passengers) {
    const request = amadeusConverters.createFlightSearchRequest(itinerary, passengers);
    const response = await amadeusClient.flightOffersSearch(request);
    amadeusClient.assertAmadeusFault(response);
    return await amadeusConverters.processFlightSearchResponse(response.data);
  }


  // eslint-disable-next-line no-unused-vars
  async retrieveSeatmaps (offers) {
    let seatmapEnabled = getConfigKey('flights.amadeus.seatmap.enabled', true);
    if (!seatmapEnabled )
      throw new GliderError('Seatmap display for this flight is not possible');   //for now we will not display seatmap for Amadeus
    let ndcBody = amadeusConverters.createRetrieveSeatmapRequest(offers);
    const response = await amadeusClient.seatmapRequest(ndcBody);
    amadeusClient.assertAmadeusFault(response);
    return amadeusConverters.processRetrieveSeatmapResponse(response.result, offers);
  }

  async priceOffers (body, offers) {
    let priceRQ = amadeusConverters.createOfferPriceRequest(offers.map(offer => offer.extraData.rawOffer));
    let response = await amadeusClient.flightOfferPrice(priceRQ);
    amadeusClient.assertAmadeusFault(response);
    return amadeusConverters.processPriceOfferResponse(response);
  }

  async orderCreate (offer, requestBody, guaranteeClaim) {
    // create request
    let request = amadeusConverters.createOrderCreateRequest(offer, requestBody, guaranteeClaim);
    let order;
    try {
      //make a call to Amadeus to create an order
      let orderCreateResponse = await amadeusClient.flightOrderCreate(request);
      // process any potential errors
      amadeusClient.assertAmadeusFault(orderCreateResponse);

      //convert to WT format
      order = amadeusConverters.orderCreateResponseProcessor(orderCreateResponse);

      //since response from order create does not contain eTicket numbers, we need to make a separate call to retrieve orders
      let eTickets = [];
      let pnrRetrieveQuery = {
        orderId: orderCreateResponse.data.id,
      };
      //retrieve an order
      let orderRetrieveResponse = await amadeusClient.flightOrderRetrieve(pnrRetrieveQuery);
      //convert response
      let retrievedOrder = amadeusConverters.orderRetrieveResponseConverter(orderRetrieveResponse);
      //extract eTicket numbers
      if (retrievedOrder && retrievedOrder.travelDocuments && retrievedOrder.travelDocuments.etickets) {
        eTickets.push(...retrievedOrder.travelDocuments.etickets);
      }

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
