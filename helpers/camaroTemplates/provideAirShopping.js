import { airFranceConfig } from '../../config';

const provideAirShoppingTransformTemplate = {
  offers: ['/S:Envelope/S:Body/AirShoppingRS/OffersGroup/AirlineOffers/Offer', {
    _id_: '@OfferID',
    expiration: 'TimeLimits/OfferExpiration/@DateTime',
    price: {
      currency: 'TotalPrice/DetailCurrencyPrice/Total/@Code',
      public: 'OfferItem/TotalPriceDetail/TotalAmount/DetailCurrencyPrice/Total',
      commission: `number(OfferItem/TotalPriceDetail/BaseAmount) * ${airFranceConfig.commission}`,
      taxes: 'OfferItem/TotalPriceDetail/Taxes/Total',
    },
    offerItems: ['OfferItem', {
      _id_:'@OfferItemID',
      _value_: {
        passengerReferences: 'Service/PassengerRefs',
      },
    }],
    itineraryCombinationReference: 'FlightsOverview/FlightRef',
    serviceClassReference: 'FlightsOverview/FlightRef/@PriceClassRef',
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
  serviceClasses: ['/S:Envelope/S:Body/AirShoppingRS/DataLists/PriceClassList/PriceClass', {
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

module.exports = {
  provideAirShoppingTransformTemplate,
  ErrorsTransformTemplate,
};
