const { basicDecorator } = require('../../decorators/basic');
const GliderError = require('../../helpers/error');
const { searchHotel } = require('../../helpers/resolvers/searchHotel');
const { searchFlight } = require('../../helpers/resolvers/searchFlight');
const {
  checkCallsTrustRequirements
} = require('../../helpers/requirements/apiCallsLimits');

module.exports = basicDecorator(async (req, res) => {
  const { body } = req;

  await checkCallsTrustRequirements(
    '/api/v1/searchOffers',
    req.verificationResult.didResult.id,
    req.verificationResult.didResult.lifDeposit.deposit
  );

  let resolver = () => {
    throw new GliderError(
      'accommodation or itinerary missing in body',
      400
    );
  };

  if (body.accommodation) {
    resolver = searchHotel;
  } else if (body.itinerary) {
    resolver = searchFlight;
  } else {
    throw new GliderError(
      'Invalid search criteria: missing itinerary or accommodation objects',
      500
    );
  }

  const result = await resolver(body);

  res.status(200).json(result);
});
