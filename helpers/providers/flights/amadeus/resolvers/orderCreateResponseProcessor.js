const { createPrice, convertGenderFromAmadeusToGlider } = require('../utils/amadeusFormatUtils');

const createPassenger = (traveler) => {
  const { id, dateOfBirth, gender, name, contact } = traveler;
  const { firstName, lastName } = name;
  const { phones, emailAddress } = contact;
  //TODO pax type missing in amadeus response
  //TODO pax civility missing in amadeus response
  let paxDetails = {
    _id_: id,
    type: 'ADT',
    gender: convertGenderFromAmadeusToGlider(gender),
    civility: '',
    lastnames: lastName,
    firstnames: firstName,
    birthdate: dateOfBirth,
    contactInformation: 'CONTACT_For_TravelerRefNumber' + id,
  };

  let contactInfo = {
    _id_: 'CONTACT_For_TravelerRefNumber' + id,
    emails: [
      {
        value: emailAddress,
      },
    ],
    phones: [
      {
        value: phones,
      },
    ],
  };

  return {
    passenger: paxDetails,
    contactInformation: contactInfo,
  };
};


const orderCreateResponseProcessor = (response) => {
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
  return order;
};


module.exports.orderCreateResponseProcessor = orderCreateResponseProcessor;
