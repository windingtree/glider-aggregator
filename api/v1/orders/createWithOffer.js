const GliderError = require('../../../helpers/error');
const { basicDecorator } = require('../../../decorators/basic');
const {
  offerManager,
  AccommodationOffer,
  FlightOffer
} = require('../../../helpers/models/offer');
const { ordersManager } = require('../../../helpers/models/order');
const {
  getGuarantee,
  claimGuaranteeWithCard
} = require('../../../helpers/guarantee');
const hotelResolver = require('../../../helpers/resolvers/hotel/orderCreateWithOffer');
const flightResolver = require('../../../helpers/resolvers/flight/orderCreateWithOffer');

module.exports = basicDecorator(async (req, res) => {
  const requestBody = req.body;

  if (!requestBody.offerId) {
    throw new GliderError(
      'Missing mandatory field: offerId',
      400
    );
  }

  // Retrieve the offer
  const storedOffer = await offerManager.getOffer(requestBody.offerId);
  
  if (!requestBody.guaranteeId) {
    throw new GliderError('Guarantee Id is required', 400);
  }

  // Get the guarantee
  const guarantee = await getGuarantee(requestBody.guaranteeId, storedOffer);

  // Claim the guarantee
  const guaranteeClaim = await claimGuaranteeWithCard(requestBody.guaranteeId);

  let orderCreationResults;

  // Handle an Accomodation offer
  if (storedOffer instanceof AccommodationOffer) {
    // Resolve this query for an hotel offer
    orderCreationResults = await hotelResolver(
      storedOffer,
      requestBody.passengers,
      guaranteeClaim.card
    );
  }

  // Handle a flight offer
  else if (storedOffer instanceof FlightOffer) {
    orderCreationResults = await flightResolver(requestBody);
  }

  // Handle other types of offer
  else {
    throw new GliderError(
      'Unable to understand the offer type',
      500
    );
  }

  await ordersManager.saveOrder(
    requestBody.offerId,
    {
      request: requestBody,
      guarantee: guarantee,
      guaranteeClaim: guaranteeClaim,
      order: orderCreationResults
    }
  );

  res.status(200).send(orderCreationResults);
});
