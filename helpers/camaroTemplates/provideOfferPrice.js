module.exports.provideOfferPriceTransformTemplate_AC = {
  offerId: '//OfferPriceRS/PricedOffer/@OfferID',
  offer: {
    expiration: '//OfferPriceRS/PricedOffer/TimeLimits/OfferExpiration/@DateTime',
    price: {
      currency: '//OfferPriceRS/PricedOffer/TotalPrice/DetailCurrencyPrice/Total/@Code',
      public: '//OfferPriceRS/PricedOffer/TotalPrice/DetailCurrencyPrice/Total',
      commission: [
        '//OfferPriceRS/PricedOffer/OfferItem',
        {
          value: 'TotalPriceDetail/BaseAmount'
        }
      ],
      taxes: [
        '//OfferPriceRS/PricedOffer/OfferItem',
        {
          value: 'TotalPriceDetail/Taxes/Total'
        }
      ]
    },
    passengers: [
      '//OfferPriceRS/DataLists/PassengerList/Passenger',
      {
        _id_: '@PassengerID',
        type: 'PTC',
        // gender: 'Individual/Gender',
        // civility: 'Individual/NameTitle',
        // lastnames: 'Individual/Surname',
        // firstnames: 'Individual/GivenName',
        // birthdate: 'Individual/Birthdate',
        // contactInformation: 'ContactInfoRef'
      }
    ],
    itinerary:  {
      segments: [
        '//OfferPriceRS/DataLists/FlightSegmentList/FlightSegment',
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
    services: [
      '//OfferPriceRS/DataLists/ServiceDefinitionList/ServiceDefinition',
      {
        _id_: '@ServiceDefinitionID',
        code: 'Encoding/Code',
        name: 'Name',
        description: [
          'Descriptions/Description',
          'Text'
        ],
        segments: [
          'ServiceBundle',
          'ServiceDefinitionRef'
        ]
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
