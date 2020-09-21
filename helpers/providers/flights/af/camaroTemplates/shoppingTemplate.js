const config = require('../../../../../config');

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
          iataCodeM: 'MarketingCarrier/AirlineID',
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

