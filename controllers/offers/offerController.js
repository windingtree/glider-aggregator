const { selectProvider, callProvider, callProviderRest } = require('../../helpers/resolvers/utils/flightUtils');
const GliderError = require('../../helpers/error');
class OfferController {
  constructor () {

  }

  static search (itinerary, accommodation, passengers) {
    let results;
    if(accommodation)
      results=this.hotelsSearch(accommodation,passengers)
    else if(itinerary)
      results=this.flightsSearch(itinerary, passengers)
    return results;
  }

  flightsSearch (itinerary, passengers) {
    const providers = selectProvider(itinerary.segments[0].origin.iataCode, itinerary.segments[0].destination.iataCode);
    if (providers.length === 0) {
      throw new GliderError('Flight providers not found for the given origin and destination', 404);
    }

  }
  hotelsSearch (accommodation, passengers) {

  }
}


module.exports = {
  OfferController: OfferController,
};
