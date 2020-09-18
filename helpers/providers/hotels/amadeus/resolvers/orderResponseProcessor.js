
const processOrderResponse = (response) => {
  const { data } = response;
  const { id: _id, associatedRecords: _associatedRecords } = data[0];
  let order = {
    orderId: _id,
    order: {
      price: undefined,
      passengers: [],
      contactList: [],
      itinerary: {
        segments: [],
      },
    },
    travelDocuments: {
      bookings: [],
      etickets: [],
    },
  };

  let pnrs = _associatedRecords.map(_associatedRecord => {
    return _associatedRecord.reference;
  });
  order.travelDocuments.bookings.push(...pnrs);
  return order;
};


module.exports = {
  processOrderResponse: processOrderResponse,
};


/*
let response = processOrderResponse(data[0]);

console.log(JSON.stringify(response));
*/
