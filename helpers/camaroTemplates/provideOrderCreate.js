module.exports.provideOrderCreateTransformTemplate_AF = {
  orderId: '/S:Envelope/S:Body/ns2:OrderViewRS/ns2:Response/ns2:Order/@OrderID',
  order: {
    version: '#1.0.0',
    orderItems: ['/S:Envelope/S:Body/ns2:OrderViewRS/ns2:Response/ns2:Order/ns2:OrderItems/ns2:OrderItem', '@OrderItemID'],
    supplier: '#ORGIDAddressSupplier',
    distributor: '#ORGIDAddressDistributor',
    type: '#transportation',
    subtype: '#flight',
    price: {
      currency: '/S:Envelope/S:Body/ns2:OrderViewRS/ns2:Response/ns2:Order/ns2:TotalOrderPrice/ns2:SimpleCurrencyPrice/@Code',
      public: '/S:Envelope/S:Body/ns2:OrderViewRS/ns2:Response/ns2:Order/ns2:TotalOrderPrice/ns2:SimpleCurrencyPrice',
      commission: ['/S:Envelope/S:Body/ns2:OrderViewRS/ns2:Response/ns2:Order/ns2:OrderItems/ns2:OrderItem', {
        value: 'ns2:PriceDetail/ns2:BaseAmount'
      }],
      taxes: ['/S:Envelope/S:Body/ns2:OrderViewRS/ns2:Response/ns2:Order/ns2:OrderItems/ns2:OrderItem', {
        value: 'ns2:PriceDetail/ns2:Taxes/ns2:Total'
      }],
    },
    passengers: ['/S:Envelope/S:Body/ns2:OrderViewRS/ns2:Response/ns2:DataLists/ns2:PassengerList/ns2:Passenger', {
      _id_: '@PassengerID',
      type: 'ns2:PTC',
      civility: 'ns2:Individual/ns2:NameTitle',
      lastnames: 'ns2:Individual/ns2:Surname',
      firstnames: 'ns2:Individual/ns2:GivenName',
      birthdate: 'ns2:Individual/ns2:Birthdate',
      contactInformation: 'ns2:ContactInfoRef'
    }],
    contactList : ['/S:Envelope/S:Body/ns2:OrderViewRS/ns2:Response/ns2:DataLists/ns2:ContactList/ns2:ContactInformation', {
      _id_: '@ContactID',
      emails: ['ns2:EmailAddress', {
        value: 'ns2:EmailAddressValue'
      }],
      phones: ['ns2:Phone', {
        value: 'concat("+",ns2:PhoneNumber)', // OrderViewRS 17.1 doesn't return the + sign
      }],
    }],
    itinerary:  {
      segments: ['/S:Envelope/S:Body/ns2:OrderViewRS/ns2:Response/ns2:DataLists/ns2:FlightSegmentList/ns2:FlightSegment', {
        _id_: '@SegmentKey',
        operatorType: '#airline',
        airlineIataCode: 'ns2:OperatingCarrier/ns2:AirlineID',
        origin: {
          locationType: '#airport',
          iataCode: 'ns2:Departure/ns2:AirportCode'
        },
        destination: {
          locationType: '#airport',
          iataCode: 'ns2:Arrival/ns2:AirportCode',
        },
        splittedDepartureTime: 'ns2:Departure/ns2:Time',
        splittedDepartureDate: 'ns2:Departure/ns2:Date',
        splittedArrivalTime: 'ns2:Arrival/ns2:Time',
        splittedArrivalDate: 'ns2:Arrival/ns2:Date',
      }],
    },
    supplierSignature: {
      agent: '#0xc0fbc1348b43d50c948edf1818b0abfdd7466b9e',
      signature: '#0xa3f20717a250c2b0b729b7e5becbff67fdaef7e0699da4de7ca5895b02a170a12d887fd3b17bfdce3481f10bea41f45ba9f709d39ce8325427b57afcfc994cee1b'
    },
  },
};

module.exports.provideOrderCreateTransformTemplate_AC = {
  orderId: '//OrderViewRS/Response/Order/@OrderID',
  order: {
    version: '#1.0.0',
    orderItems: ['//OrderViewRS/Response/Order/OrderItems/OrderItem', '@OrderItemID'],
    supplier: '#ORGIDAddressSupplier',
    distributor: '#ORGIDAddressDistributor',
    type: '#transportation',
    subtype: '#flight',
    price: {
      currency: '//OrderViewRS/Response/Order/TotalOrderPrice/DetailCurrencyPrice/Total/@Code',
      public: '//OrderViewRS/Response/Order/TotalOrderPrice/DetailCurrencyPrice/Total',
      commission: [
        '//OrderViewRS/Response/Order/OrderItems/OrderItem',
        {
          value: 'PriceDetail/BaseAmount'
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
          operatorType: '#airline',
          airlineIataCode: 'OperatingCarrier/AirlineID',
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
    supplierSignature: {
      agent: '#0xc0fbc1348b43d50c948edf1818b0abfdd7466b9e',
      signature: '#0xa3f20717a250c2b0b729b7e5becbff67fdaef7e0699da4de7ca5895b02a170a12d887fd3b17bfdce3481f10bea41f45ba9f709d39ce8325427b57afcfc994cee1b'
    }
  }
};

module.exports.ErrorsTransformTemplate_AF = {
  errors: ['/S:Envelope/S:Body/ns2:OrderViewRS/ns2:Errors/ns2:Error', {
    message: '@ShortText',
    code: '@Code',
  }]
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
