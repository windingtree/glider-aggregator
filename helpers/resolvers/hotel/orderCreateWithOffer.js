/*
  Resolve the order creation from offer of an hotel
  Currently hardcoded to e-revemax
*/
const { createHotelProvider } = require('../../providers/providerFactory');

const { v4: uuidv4 } = require('uuid');


module.exports = async (offer, passengers, card) => {
  let provider = offer.provider;
  let providerImpl = createHotelProvider(provider);
  let responseData = await providerImpl.createOrder(offer, passengers, card);
  return {
    orderId: uuidv4(),
    order: {
      ...responseData,
      passengers,
    },
  };
};
