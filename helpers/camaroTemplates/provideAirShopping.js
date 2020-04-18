//import { airFranceConfig } from '../../config';
const config = require('../../config');

const provideAirShoppingTransformTemplate_AC = {
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
          iataCode: 'MarketingCarrier/AirlineID',
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

const provideAirShoppingTransformTemplate_AF = {
  offers: ['/S:Envelope/S:Body/AirShoppingRS/OffersGroup/AirlineOffers/Offer', {
    _id_: '@OfferID',
    expiration: 'TimeLimits/OfferExpiration/@DateTime',
    price: {
      currency: 'TotalPrice/DetailCurrencyPrice/Total/@Code',
      public: 'OfferItem/TotalPriceDetail/TotalAmount/DetailCurrencyPrice/Total',
      commission: `number(OfferItem/TotalPriceDetail/BaseAmount) * ${config.airFranceConfig.commission}`,
      taxes: 'OfferItem/TotalPriceDetail/Taxes/Total',
    },
    offerItems: ['OfferItem', {
      _id_:'@OfferItemID',
      _value_: {
        passengerReferences: 'Service/PassengerRefs',
      },
    }],
    flightsReferences: ['FlightsOverview/FlightRef', {
      flightRef: '.',
      priceClassRef: '@PriceClassRef',
    }],
  }],
  itineraries: {
    combinations: ['/S:Envelope/S:Body/AirShoppingRS/DataLists/FlightList/Flight', {
      _id_: '@FlightKey',
      _items_: 'SegmentReferences',
    }],
    segments: ['/S:Envelope/S:Body/AirShoppingRS/DataLists/FlightSegmentList/FlightSegment', {
      _id_: '@SegmentKey',
      operator: {
        operatorType: '#airline',
        iataCode: 'OperatingCarrier/AirlineID',
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
    }],
  },
  pricePlans: ['/S:Envelope/S:Body/AirShoppingRS/DataLists/PriceClassList/PriceClass', {
    _id_: '@PriceClassID',
    name: 'ClassOfService/MarketingName',
    amenities: [],
    checkedBaggages: 'ClassOfService/@refs',
  }],
  passengers: ['/S:Envelope/S:Body/AirShoppingRS/DataLists/PassengerList/Passenger', {
    _id_: '@PassengerID',
    type: 'PTC',
  }],
  checkedBaggages: ['/S:Envelope/S:Body/AirShoppingRS/DataLists/CheckedBagAllowanceList/CheckedBagAllowance', {
    _id_: '@ListKey',
    quantity: 'PieceAllowance/TotalQuantity'
  }]
};

const ErrorsTransformTemplate_AF = {
  errors: ['/S:Envelope/S:Body/AirShoppingRS/Errors/Error', {
    message: '@ShortText',
    code: '@Code',
  }]
};

const ErrorsTransformTemplate_AC = {
  errors: ['//NDCMSG_Fault', {
    message: 'Description',
    code: 'ErrorCode',
    date: 'Timestamp'
  }]
};

module.exports.provideAirShoppingTransformTemplate_AF = provideAirShoppingTransformTemplate_AF;
module.exports.provideAirShoppingTransformTemplate_AC = provideAirShoppingTransformTemplate_AC;
module.exports.ErrorsTransformTemplate_AF = ErrorsTransformTemplate_AF;
module.exports.ErrorsTransformTemplate_AC = ErrorsTransformTemplate_AC;
