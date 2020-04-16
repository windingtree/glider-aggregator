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
        '//AirShoppingRS/OffersGroup/AirlineOffers/Offer/OfferItem/Service',
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
      checkedBaggages: 'ClassOfService/@refs',
    }
  ],
  passengers: [
    '//AirShoppingRS/DataLists/PassengerList/Passenger',
    {
      _id_: '@PassengerID',
      type: 'PTC',
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
    //itineraryCombinationReference: 'FlightsOverview/FlightRef',
    //serviceClassReference: 'FlightsOverview/FlightRef/@PriceClassRef',
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

const ErrorsTransformTemplate = {
  errors: ['/S:Envelope/S:Body/AirShoppingRS/Errors/Error', {
    message: '@ShortText',
    code: '@Code',
  }]
};

module.exports.provideAirShoppingTransformTemplate_AF = provideAirShoppingTransformTemplate_AF;
module.exports.provideAirShoppingTransformTemplate_AC = provideAirShoppingTransformTemplate_AC;
module.exports.ErrorsTransformTemplate = ErrorsTransformTemplate;
