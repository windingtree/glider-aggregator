module.exports.offerPriceRequestTemplate_1A = (offers) => {
  console.log('offerPriceRequestTemplate_1A, offer to price:', JSON.stringify(offers));
  let request = {
    data: {
      type: 'flight-offers-pricing',
      flightOffers: [],
    }
  };
  request.data.flightOffers.push(...offers);
  return request;
};
