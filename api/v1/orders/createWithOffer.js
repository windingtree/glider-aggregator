const axios = require('axios');
const config = require('../../../config');
const GliderError = require('../../../helpers/error');
const { basicDecorator } = require('../../../decorators/basic');

const offer = require('../../../helpers/models/offer');
const { ordersManager } = require('../../../helpers/models/order');
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
  let guaranteeClaimResponse;

  try {
    // Get the guarantee
    guaranteeResponse = await axios.get(
      `${config.SIMARD_URL}/balances/guarantees/${requestBody.guaranteeId}`,
      {
        headers: simardHeaders,
      }
    );
    
    // Check guarantee currency
    if (guaranteeResponse.data.currency !== storedOffer.currency) {
      throw new GliderError(
        `The guarantee currency: ${guaranteeResponse.data.currency} is different from offer currency: ${storedOffer.currency}`,
        400
      );
    }

    // Check guarantee amount
    if (Number(guaranteeResponse.data.amount) < Number(storedOffer.amountBeforeTax)) {
      throw new GliderError(
        `The guarantee amount: ${guaranteeResponse.data.currency} is less then offer amount: ${storedOffer.amountBeforeTax}`,
        400
      );
    }

    // Claim the guarantee
    guaranteeClaimResponse = await axios.post(
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
      guaranteeClaimResponse.data.card
    );
  }

  // Handle a flight offer
  else if (storedOffer instanceof offer.FlightOffer) {
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
      guarantee: guaranteeClaimResponse.data,
      order: orderCreationResults
    }
  );

  res.status(200).send(orderCreationResults);
});
