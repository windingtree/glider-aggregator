const  { airCanadaConfig } = require('../../../../../config');


module.exports.provideOrderCreateTransformTemplate_AC = {
  orderId: '//OrderViewRS/Response/Order/@OrderID',
  order: {
    version: '#1.0.0',
    type: '#transportation',
    subtype: '#flight',
    price: {
      currency: '//OrderViewRS/Response/Order/TotalOrderPrice/DetailCurrencyPrice/Total/@Code',
      public: '//OrderViewRS/Response/Order/TotalOrderPrice/DetailCurrencyPrice/Total',
      commission: [
        '//OrderViewRS/Response/Order/OrderItems/OrderItem',
        {
          value: `number(PriceDetail/BaseAmount) * ${airCanadaConfig.commission}`
        }
      ],
      taxes: [
        '//OrderViewRS/Response/Order/OrderItems/OrderItem',
        {
          value: 'PriceDetail/Taxes/Total'
        }
      ]
    },
    passengers: [
      '//OrderViewRS/Response/DataLists/PassengerList/Passenger',
      {
        _id_: '@PassengerID',
        type: 'PTC',
        gender: 'Individual/Gender',
        civility: 'Individual/NameTitle',
        lastnames: 'Individual/Surname',
        firstnames: 'Individual/GivenName',
        birthdate: 'Individual/Birthdate',
        contactInformation: 'ContactInfoRef'
      }
    ],
    contactList: [
      '//OrderViewRS/Response/DataLists/ContactList/ContactInformation',
      {
        _id_: '@ContactID',
        emails: [
          'ContactProvided/EmailAddress',
          {
            value: 'EmailAddressValue'
          }
        ],
        phones: [
          'ContactProvided/Phone',
          {
            value: 'concat("+",CountryDialingCode,AreaCode,PhoneNumber)',
          }
        ]
      }
    ],
    itinerary:  {
      segments: [
        '//OrderViewRS/Response/DataLists/FlightSegmentList/FlightSegment',
        {
          _id_: '@SegmentKey',
          operator: {
            operatorType: '#airline',
            iataCode: 'OperatingCarrier/AirlineID',
            iataCodeM: 'MarketingCarrier/AirlineID',
            flightNumber: 'MarketingCarrier/FlightNumber'
          },
          origin: {
            locationType: '#airport',
            iataCode: 'Departure/AirportCode'
          },
          destination: {
            locationType: '#airport',
            iataCode: 'Arrival/AirportCode'
          },
          splittedDepartureTime: 'Departure/Time',
          splittedDepartureDate: 'Departure/Date',
          splittedArrivalTime: 'Arrival/Time',
          splittedArrivalDate: 'Arrival/Date'
        }
      ]
    },
    // supplierSignature: {
    //   agent: '#0xc0fbc1348b43d50c948edf1818b0abfdd7466b9e',
    //   signature: '#0xa3f20717a250c2b0b729b7e5becbff67fdaef7e0699da4de7ca5895b02a170a12d887fd3b17bfdce3481f10bea41f45ba9f709d39ce8325427b57afcfc994cee1b'
    // }
  },
  travelDocuments: {
    bookings: [
      '//OrderViewRS/Response/Order/BookingReferences/BookingReference',
      'ID'
    ],
    etickets: [
      '//OrderViewRS/Response/TicketDocInfos/TicketDocInfo',
      {
        _id_: 'TicketDocument/TicketDocNbr',
        _passenger_: 'PassengerReference'
      }
    ]
  }
};


module.exports.FaultsTransformTemplate_AC = {
  errors: ['//NDCMSG_Fault', {
    message: 'Description',
    code: 'ErrorCode',
    date: 'Timestamp'
  }]
};

module.exports.ErrorsTransformTemplate_AC = {
  errors: ['//Errors', {
    message: 'Error',
    code: 'Error/@Code',
    type: 'Error/@Type'
  }]
};
