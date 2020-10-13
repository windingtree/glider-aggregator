const  { airFranceConfig } = require('../../../../../config');

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
        value: `number(ns2:PriceDetail/ns2:BaseAmount) * ${airFranceConfig.commission}`
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

module.exports.ErrorsTransformTemplate_AF = {
  errors: ['/S:Envelope/S:Body/ns2:OrderViewRS/ns2:Errors/ns2:Error', {
    message: '@ShortText',
    code: '@Code',
  }]
};
