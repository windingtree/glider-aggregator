//request
const GliderError = require('../../../../error');


const createOrderRetrieveRequest = () => {
  let request;
  return request;
};


const orderCreateRequestResponseConverters = (response) => {
  const { id: _id, associatedRecords: _associatedRecords, travelers: _travelers } = response.data;


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
  let uniqueTravelers = {};

  _travelers.map(_traveler => {
    uniqueTravelers[_traveler.id] = _traveler;
  });

  Object.keys(uniqueTravelers).map(travelerId => {
    let { passenger, contactInformation } = createPassenger(uniqueTravelers[travelerId]);
    order.order.passengers.push(passenger);
    order.order.contactList.push(contactInformation);
  });

  let _offer = response.data.flightOffers[0];
  let price = createPrice(_offer.price, 0); //TODO add commission
  order.order.price = price;

  let segments = [];
  _offer.itineraries.forEach(_itinerary => {
    _itinerary.segments.forEach(_segment => {
      segments.push(createSegment(_segment));
    });
  });

  order.order.itinerary.segments = segments;

  return order;
};


module.exports = { orderCreateResponseProcessor: orderCreateRequestResponseConverters, createOrderCreateRequest };
