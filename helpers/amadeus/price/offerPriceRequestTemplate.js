module.exports.offerPriceRequestTemplate_1A = (offers) => {
  let request = {
    data: {
      type: 'flight-offers-pricing',
      flightOffers: [],
    }
  };
  request.data.flightOffers.push(...offers);
  return request;
};
