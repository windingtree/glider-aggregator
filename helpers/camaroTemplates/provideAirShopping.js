const config = require('../../config');

module.exports.provideAirShoppingTransformTemplate_AC = {
  offers: [
    '//AirShoppingRS/OffersGroup/AirlineOffers/Offer',
    {
      _id_: '@OfferID',
      offerItems: [
        'OfferItem',
        {
          _id_: '@OfferItemID',
          _value_: {
            passengerReferences: 'Service/PassengerRefs'
          }
        }
      ],
      expiration: '',
      price: {
        currency: 'TotalPrice/DetailCurrencyPrice/Total/@Code',
        public: 'TotalPrice/DetailCurrencyPrice/Total',
        commission: `number(OfferItem/TotalPriceDetail/BaseAmount) * ${config.airCanadaConfig.commission}`,
        taxes: 'OfferItem/TotalPriceDetail/Taxes/Total'
      },
      pricePlansReferences: [
        'OfferItem/Service',
        {
          _id_: 'ServiceRef',
          flights: 'FlightRefs'
        }
      ]
    }
  ],
  itineraries: {
    combinations: [
      '//AirShoppingRS/DataLists/OriginDestinationList/OriginDestination',
      {
        _id_: '@OriginDestinationKey',
        _items_: 'FlightReferences',
      }
    ],
    segments: [
      '//AirShoppingRS/DataLists/FlightSegmentList/FlightSegment',
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
        splittedArrivalDate: 'Arrival/Date',
        Departure: {
          AirportCode: 'Departure/AirportCode',
          Date: 'Departure/Date',
          Time: 'Departure/Time',
          Terminal: {
            Name: 'Departure/Terminal/Name'
          }
        },
        Arrival: {
          AirportCode: 'Arrival/AirportCode',
          Date: 'Arrival/Date',
          Time: 'Arrival/Time',
          Terminal: {
            Name: 'Arrival/Terminal/Name'
          }
        },
        MarketingCarrier: {
          AirlineID: 'MarketingCarrier/AirlineID',
          Name: 'MarketingCarrier/Name',
          FlightNumber: 'MarketingCarrier/FlightNumber',
          ResBookDesigCode: 'MarketingCarrier/ResBookDesigCode'
        },
        OperatingCarrier: {
          Disclosures: {
            Description: {
              Text: 'OperatingCarrier/Disclosures/Description/Text'
            }
          }
        },
        Equipment: {
          AircraftCode: 'Equipment/AircraftCode'
        },
        ClassOfService: {
          Code: 'ClassOfService/Code'
        },
        FlightDetail: {
          FlightDuration: {
            Value: 'FlightDetail/FlightDuration/Value'
          },
          Stops: {
            StopQuantity: 'FlightDetail/Stops/StopQuantity'
          }
        }
      }
    ]
  },
  pricePlans: [
    '//AirShoppingRS/DataLists/PriceClassList/PriceClass',
    {
      _id_: '@PriceClassID',
      name: 'Name',
      amenities: [
        'Descriptions/Description',
        'Text'
      ],
      checkedBaggages: ''
    }
  ],
  passengers: [
    '//AirShoppingRS/DataLists/PassengerList/Passenger',
    {
      _id_: '@PassengerID',
      type: 'PTC'
    }
  ],
  destinations: [
    '//AirShoppingRS/DataLists/OriginDestinationList/OriginDestination',
    {
      _id_: '@OriginDestinationKey',
      DepartureCode: 'DepartureCode',
      ArrivalCode: 'ArrivalCode',
      FlightReferences: 'FlightReferences'
    }
  ]
};

module.exports.provideAirShoppingTransformTemplate_AF = {
  offers: [
    '//AirShoppingRS/OffersGroup/AirlineOffers/Offer',
    {
      _id_: '@OfferID',
      expiration: 'TimeLimits/OfferExpiration/@DateTime',
      price: {
        currency: 'TotalPrice/DetailCurrencyPrice/Total/@Code',
        public: 'OfferItem/TotalPriceDetail/TotalAmount/DetailCurrencyPrice/Total',
        commission: `number(OfferItem/TotalPriceDetail/BaseAmount) * ${config.airFranceConfig.commission}`,
        taxes: 'OfferItem/TotalPriceDetail/Taxes/Total',
      },
      offerItems: [
        'OfferItem',
        {
          _id_:'@OfferItemID',
          _value_: {
            passengerReferences: 'Service/PassengerRefs',
          },
        }
      ],
      flightsReferences: [
        'FlightsOverview/FlightRef',
        {
          flightRef: '.',
          priceClassRef: '@PriceClassRef',
        }
      ]
    }
  ],
  itineraries: {
    combinations: [
      '//AirShoppingRS/DataLists/FlightList/Flight',
      {
        _id_: '@FlightKey',
        _items_: 'SegmentReferences',
      }
    ],
    segments: [
      '//AirShoppingRS/DataLists/FlightSegmentList/FlightSegment',
      {
        _id_: '@SegmentKey',
        operator: {
          operatorType: '#airline',
          iataCode: 'OperatingCarrier/AirlineID',
          flightNumber: 'MarketingCarrier/FlightNumber'
        },
        origin: {
          locationType: '#airport',
          iataCode: 'Departure/AirportCode',
        },
        destination: {
          locationType: '#airport',
          iataCode: 'Arrival/AirportCode',
        },
        splittedDepartureTime: 'Departure/Time',
        splittedDepartureDate: 'Departure/Date',
        splittedArrivalTime: 'Arrival/Time',
        splittedArrivalDate: 'Arrival/Date',
      }
    ],
  },
  pricePlans: [
    '//AirShoppingRS/DataLists/PriceClassList/PriceClass',
    {
      _id_: '@PriceClassID',
      name: 'ClassOfService/MarketingName',
      amenities: [],
      checkedBaggages: 'ClassOfService/@refs',
    }
  ],
  passengers: [
    '//AirShoppingRS/DataLists/PassengerList/Passenger',
    {
      _id_: '@PassengerID',
      type: 'PTC',
    }
  ],
  checkedBaggages: [
    '//AirShoppingRS/DataLists/CheckedBagAllowanceList/CheckedBagAllowance',
    {
      _id_: '@ListKey',
      quantity: 'number(PieceAllowance/TotalQuantity)'
    }
  ]
};

module.exports.ErrorsTransformTemplate_AF = {
  errors: ['//AirShoppingRS/Errors/Error', {
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
