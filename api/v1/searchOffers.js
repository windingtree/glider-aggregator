/* istanbul ignore file */
const { basicDecorator } = require('../../decorators/basic');
const { searchHotel } = require('../../helpers/resolvers/searchHotel');
const { searchFlight } = require('../../helpers/resolvers/searchFlight');
const { checkCallsTrustRequirements } = require('../../helpers/requirements/apiCallsLimits');
const { validateSearchCriteria } = require('../../payload/validators');
module.exports = basicDecorator(async (req, res) => {
  let { body } = req;
  body = validateSearchCriteria(body);
  await checkCallsTrustRequirements('/api/v1/searchOffers', req.verificationResult.didResult.id, req.verificationResult.didResult.lifDeposit.deposit);
  // const controller = new OfferController();
  let result;
  const { itinerary, accommodation/*, passengers */ } = body;
  if (accommodation) {
    result = await searchHotel(body);
  } else if (itinerary) {
    // result = await controller.flightsSearch(itinerary,passengers);
    result = await searchFlight(body);
  }
  res.status(200).json(result);
});
