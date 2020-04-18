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

  let orderCreationResults;
  let guarantee;
  let guaranteeClaim;

  if (requestBody.guaranteeId) {
    // Get the guarantee
    guarantee = await getGuarantee(requestBody.guaranteeId, storedOffer);
  
    // Claim the guarantee
    guaranteeClaim = await claimGuaranteeWithCard(requestBody.guaranteeId);
  }

  // Handle an Accomodation offer
  if (storedOffer instanceof AccommodationOffer) {

    if (!guaranteeClaim) {
      throw new GliderError(
        'Claimed guarantee is required',
        400
      );
    }

    // Resolve this query for an hotel offer
    orderCreationResults = await hotelResolver(
      storedOffer,
      requestBody.passengers,
      guaranteeClaim.card
    );
  }

  // Handle a flight offer
  else if (storedOffer instanceof FlightOffer) {
    orderCreationResults = await flightResolver(
      storedOffer,
      requestBody,
      guaranteeClaim
    );
  }

  // Handle other types of offer
  else {
    throw new GliderError(
      'Unable to understand the offer type',
      500
    );
  }

  await ordersManager.saveOrder(
    orderCreationResults.orderId,
    {
      request: requestBody,
      guarantee: guarantee,
      guaranteeClaim: guaranteeClaim,
      order: orderCreationResults
    }
  );

  res.status(200).json(orderCreationResults);
});
