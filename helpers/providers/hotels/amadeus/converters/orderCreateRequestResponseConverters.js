//request

const createOrderRequest = (offer, passengers, card) => {
  let vendorCode = 'VI';

  let guests = Object.keys(passengers).map(paxId => {
    let pax = passengers[paxId];
    let ci = pax.contactInformation || [];
    let phone = (ci.length >= 1) ? ci[0] : '';
    let email = (ci.length >= 2) ? ci[1] : '';
    let record = {
      'name': {
        'title': pax.civility,
        'firstName': pax.firstnames.join(' '),
        'lastName': pax.lastnames.join(' '),
      },
      'contact': {
        'phone': phone,
        'email': email,
      },
    };
    return record;
  });
  let request = {
    'data': {
      'offerId': offer.roomTypeCode,
      'guests': guests,
      'payments': [
        {
          'method': 'creditCard',
          'card': {
            'vendorCode': vendorCode,
            'cardNumber': card.accountNumber,
            'expiryDate': `${card.expiryYear}-${card.expiryMonth}`,
          },
        },
      ],
    },
  };
  return request;
};


//response
const processOrderResponse = (response) => {
  const { data } = response;
  const { id: _id, associatedRecords: _associatedRecords, providerConfirmationId } = data[0];
  let order = {
    orderId: _id,
    response: 'Committed',
    reservationNumber: providerConfirmationId,
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
  processOrderResponse, createOrderRequest,
};

