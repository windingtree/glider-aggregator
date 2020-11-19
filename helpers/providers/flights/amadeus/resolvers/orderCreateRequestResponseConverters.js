const { createPrice, convertGenderFromAmadeusToGlider } = require('./amadeusFormatUtils');
//request
const { convertGenderFromGliderToAmadeus, createSegment } = require('./amadeusFormatUtils');
const GliderError = require('../../../../error');
const { getFeatureFlag } = require('../../../../../config');

const { parsePhoneNumberWithError, ParseError } = require('libphonenumber-js');


const createTraveller = (id, pax) => {
  const { civility, firstnames, lastnames, birthdate, contactInformation } = pax;
  const email = contactInformation && contactInformation.length > 1 ? contactInformation[1] : null;
  const phone = contactInformation && contactInformation.length > 0 ? contactInformation[0] : null;
  if (!email) throw new GliderError(`Missing email address for passenger ${id}`);
  if (!phone) throw new GliderError(`Missing phone number for passenger ${id}`);

  let ctcmNumber;
  let ctcmCountryCode;
  try {
    const phoneNumber = parsePhoneNumberWithError(phone);
    ctcmCountryCode = phoneNumber.countryCallingCode;
    ctcmNumber = phoneNumber.nationalNumber;
  } catch (error) {
    if (error instanceof ParseError) {
      // Not a phone number, non-existent country, etc.
      console.log('Cannot properly parse phone number:', error.message);
    } else {
      //we can ignore this - in this case CTCM will fail but booking still can be created
      // throw error
    }
  }
  //FIXME - hardcoded pax type
  return {
    id: id,
    dateOfBirth: birthdate.substr(0, 10),
    name: {
      firstName: firstnames.join(' '),
      lastName: lastnames.join(' '),
    },
    gender: convertGenderFromGliderToAmadeus(civility),
    contact: {
      emailAddress: email,
      phones: [{
        deviceType: 'MOBILE',
        countryCallingCode: ctcmCountryCode,
        number: ctcmNumber,
      }],
    },
    documents: [],
  };
};

const createOrderCreateRequest = (order, body) => {
  //create list of passengers to be sent to Amadeus (convert pax details from Glider API format)
  let passengers = [];

  let mappedPassengers = order.extraData.mappedPassengers;  //glider ID to Amadeus ID map
  let passengerTypeToIdMap = order.extraData.passengers;    //pax type (ADT, CHD, INF) to gliderID


  Object.keys(body.passengers).map(paxId => {
    let pax = body.passengers[paxId];
    let paxType = pax.type;
    let gliderPaxId = passengerTypeToIdMap[paxType].pop();
    let amadeusPaxId = mappedPassengers[gliderPaxId];
    let traveller = createTraveller(amadeusPaxId, pax);
    passengers.push(traveller);
  });

  let rawOffer = order.extraData.rawOffer;

  let request = {
    data: {
      type: 'flight-order',
      flightOffers: [rawOffer],
      travelers: [...passengers],
      remarks: {
        general: [
          {
            subType: 'GENERAL_MISCELLANEOUS',
            text: 'GLIDER OTA BOOKING',
          },
        ],
      },
      formOfPayments: [
        {
          other: {
            method: 'CASH',
            flightOfferIds: [rawOffer.id],
          },
        },
      ],
    },
  };
  //do we need to queue a PNR to a queue?
  let queuingOfficeId = getFeatureFlag('flights.amadeus.queuingOfficeId');
  if (queuingOfficeId && queuingOfficeId.length > 0) {
    request.data.queuingOfficeId = queuingOfficeId;
  }

  //do we need to transfer ownership to a specific queue?
  let ownerOfficeId = getFeatureFlag('flights.amadeus.ownerOfficeId');
  if (ownerOfficeId && ownerOfficeId.length > 0) {
    request.data.ownerOfficeId = ownerOfficeId;
  }


  // request.data.flightOffers.push(...offers);
  return request;
};


//response
const createPassenger = (traveler) => {
  const { id, dateOfBirth, gender, name, contact } = traveler;
  const { firstName, lastName } = name;
  //TODO pax type missing in amadeus response
  //TODO pax civility missing in amadeus response

  let paxDetails = {
    _id_: id,
    type: 'ADT',
    gender: (gender?convertGenderFromAmadeusToGlider(gender):''),
    civility: '',
    lastnames: lastName,
    firstnames: firstName,
    birthdate: dateOfBirth,
    contactInformation: 'CONTACT_For_TravelerRefNumber' + id,
  };

  //create array with pax phones (concatenate country dialing code with actual number as used in aggregator
  let phonesArr=[];
  if(contact && contact.phones) {
    phonesArr = contact.phones.map(phone => {
      return {
        value: `${phone.countryCallingCode}${phone.number}`,
      };
    });
  }
  //create array with email (if it exists)
  let emailArr=[];
  if(contact && contact.emailAddress){
    emailArr.push({
      value: contact.emailAddress
    });
  }
  let contactInfo = {
    _id_: 'CONTACT_For_TravelerRefNumber' + id,
    emails: emailArr,
    phones: phonesArr,
  };
  return {
    passenger: paxDetails,
    contactInformation: contactInfo,
  };
};

const orderRetrieveResponseConverter = (response) => {
  return convertOrderFormAmadeusResponse(response.data);
};
const orderCreateRequestResponseConverters = (response) => {
  return convertOrderFormAmadeusResponse(response.data);
};
const convertOrderFormAmadeusResponse = (orderResponse) => {
  const { id: _id, associatedRecords: _associatedRecords, travelers: _travelers, tickets: _tickets, flightOffers:_flightOffers } = orderResponse;


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

  if(_associatedRecords) {
    let pnrs = _associatedRecords.map(_associatedRecord => {
      return _associatedRecord.reference;
    });
    //remove dupes
    let pnrsSet = new Set(pnrs);
    order.travelDocuments.bookings = [...pnrsSet];
  }
  if (_tickets) {
    let eTickets = _tickets.map(_ticket => {
      return _ticket.documentNumber;
    });
    //remove dupes
    let eTicketsSet = new Set(eTickets);
    order.travelDocuments.etickets = [...eTicketsSet];
  }
  let uniqueTravelers = {};

  _travelers.map(_traveler => {
    uniqueTravelers[_traveler.id] = _traveler;
  });

  Object.keys(uniqueTravelers).map(travelerId => {
    let { passenger, contactInformation } = createPassenger(uniqueTravelers[travelerId]);
    order.order.passengers.push(passenger);
    order.order.contactList.push(contactInformation);
  });

  let _offer = _flightOffers[0];
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


module.exports = { orderCreateResponseProcessor: orderCreateRequestResponseConverters, createOrderCreateRequest, orderRetrieveResponseConverter };
