
const { createRequest, transformAmadeusResponse } = require('./resolvers');
const { callProviderRest, transformAmadeusFault, REQUESTS } = require('./amadeusUtils');
const { assertAmadeusFault } = require('./errors');
const { offerPriceResponseProcessor } = require('./resolvers/offerPriceResponseProcessor');
const { offerPriceRequestTemplate_1A } = require('./resolvers/offerPriceRequestTemplate');
const { orderCreateResponseProcessor } = require('./resolvers/orderCreateResponseProcessor');
const GliderError = require('../../../error');
const { orderCreateRequestTemplate_1A } = require('./resolvers/orderCreateRequestTemplate');

const FlightProvider = require('../../flightProvider');

module.exports = class FlightProvider1A extends FlightProvider {
  constructor () {
    super();
  }

  async flightSearch (itinerary, passengers) {
    const request = createRequest(itinerary, passengers);
    const { response } = await callProviderRest(this.getProviderID(), undefined, undefined, request, REQUESTS.SEARCHOFFERS, undefined);
    let errorsResult = transformAmadeusFault(response.result);
    //TODO fix error handling
    let searchResults = transformAmadeusResponse(response.data);
    return { provider: this.getProviderID(), response: searchResults, errors: errorsResult ? errorsResult.errors : [] };
  }

  async priceOffers (body, offers) {
    let priceRQ = offerPriceRequestTemplate_1A(offers.map(offer => offer.extraData.rawOffer));
    const { response, error } = await callProviderRest('', '', '', priceRQ, 'PRICEOFFERS');
    //TODO fix error handling
    assertAmadeusFault(response, error);
    let offerResult = offerPriceResponseProcessor(response.result);
    return offerResult;
  }

  async orderCreate (offer, requestBody, guaranteeClaim) {
    // create request
    let request = orderCreateRequestTemplate_1A(offer, requestBody, guaranteeClaim);
    //make a call
    const { response, error } = await callProviderRest('', '', '', request, 'ORDERCREATE');
    // process any potential errors
    const errorsResult = transformAmadeusFault(response.result);

    // If an error is found, stop here
    if (errorsResult && errorsResult.errors.length) {
      throw new GliderError(
        errorsResult.errors.map(e => e.message).join('; '),
        502,
      );
    } else if (error) {
      throw new GliderError(
        error.message,
        502,
      );
    }
    // Otherwise parse as a result
    const createResults = orderCreateResponseProcessor(response.result);
    return createResults;
  }

  getProviderID () {
    return '1A';
  }
};
