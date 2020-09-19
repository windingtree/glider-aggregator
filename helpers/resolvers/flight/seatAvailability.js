const { createFlightProvider } = require ('../../providers/providerFactory');
const GliderError = require('../../error');
const {
  fetchFlightsOffersByIds,
} = require('../utils/flightUtils');


// Create a SeatMap request
module.exports.seatMapRQ = async (offerIds) => {
  if (!offerIds) {
    throw new GliderError('Missing mandatory field: offerIds', 400);
  }
  // Convert incoming Ids into list
  offerIds = offerIds.split(',').map(o => o.trim());
  // Retrieve the offers
  const offers = await fetchFlightsOffersByIds(offerIds);
  let providerImpl = createFlightProvider (offers[0].provider);
  let seatMapResult =providerImpl.retrieveSeatmaps(offers);
  return seatMapResult;
};
