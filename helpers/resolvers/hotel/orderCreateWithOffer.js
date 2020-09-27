/*
  Resolve the order creation from offer of an hotel
  Currently hardcoded to e-revemax
*/
const { createHotelProvider } = require('../../providers/providerFactory');

const { v4: uuidv4 } = require('uuid');


module.exports = async (offer, passengers, card) => {
  let provider = offer.provider;
  let providerImpl = createHotelProvider(provider);
  // providerImpl.createOrder(offer, passengers, card);
  /*if (!process.env.TESTING) {

  } else {
    response = process.env.TESTING_PROVIDER_ERRORS === '1'
      ? {
        status: 502,
        data: {}
      }
      : require('../../../test/mocks/erevmaxOrder.json');
  }
  // console.log('@@@', require('../../json').stringifyCircular(response));

  */
  let responseData = await providerImpl.createOrder(offer, passengers, card);
  return {
    orderId: uuidv4(),
    order: {
      ...responseData,
      passengers,
    },
  };
};
