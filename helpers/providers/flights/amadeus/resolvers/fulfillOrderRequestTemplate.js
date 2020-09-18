module.exports.fulfillOrderTemplate_1A = (order, body, guaranteeClaim) => {
  console.log('fulfillOrderTemplate_1A, order:', JSON.stringify(order));
  console.log('fulfillOrderTemplate_1A, body:', JSON.stringify(body));
  console.log('fulfillOrderTemplate_1A, guaranteeClaim:', JSON.stringify(guaranteeClaim));
  let request = {
    data: {
      type: 'flight-order',
      flightOffers: [],
      travelers:[],
      documents:[]
    }
  };
  // request.data.flightOffers.push(...offers);
  return request;
};
