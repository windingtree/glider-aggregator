const axios = require('axios');
const config = require('../../../config');
const GliderError = require('../../../helpers/error');
const { basicDecorator } = require('../../../decorators/basic');

const offer = require('../../../helpers/models/offer');
const hotelResolver = require('../../../helpers/resolvers/hotel/orderCreateWithOffer');
const flightResolver = require('../../../helpers/resolvers/flight/orderCreateWithOffer');

const simardHeaders = {
  Authorization: `Bearer ${config.JWT}`,
};

module.exports = basicDecorator(async (req, res) => {
  const requestBody = req.body;

  if (!requestBody.offerId) {
    throw new GliderError(
      'Missing mandatory field: offerId',
      400
    );
  }

  // Retrieve the offer
  const storedOffer = await offer.offerManager.getOffer(requestBody.offerId);
  
  if (!requestBody.guaranteeId) {
    throw new GliderError('Guarantee Id is required', 400);
  }

  let guaranteeResponse;

  try {
    guaranteeResponse = await axios.post(
      `${config.SIMARD_URL}/balances/guarantees/${requestBody.guaranteeId}/claimWithCard`,
      {
        // Date.now() + 7 days
        expiration: new Date(Date.now() + 60 * 1000 * 60 * 24 * 7).toISOString()
      },
      {
        headers: simardHeaders,
      }
    );
  } catch (e) {
    let message = e.message;
    let status = 500;

    // Use the error message from the Simard response if provided
    if (e.response && e.response.status && e.response.data.message) {
      message = e.response.data.message;
      status = e.response.status;
    }

    throw new GliderError(message, status);
  }

  let orderCreationResults;

  // Handle an Accomodation offer
  if (storedOffer instanceof offer.AccommodationOffer) {
    // Resolve this query for an hotel offer
    orderCreationResults = await hotelResolver(
      storedOffer,
      requestBody.passengers,
      guaranteeResponse.data.card
    );
    res.status(200).send(orderCreationResults);
  }

  // Handle a flight offer
  else if (storedOffer instanceof offer.FlightOffer) {
    orderCreationResults = await flightResolver(requestBody);
    res.send(orderCreationResults);
  }

  // Handle other types of offer
  else {
    throw new GliderError(
      'Unable to understand the offer type',
      500
    );
  }
});
