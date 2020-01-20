import { airFranceConfig } from '../../config';

const textOrDefault = (defaultValue = 'airport') => `concat(
  text(),
  substring(
      "${defaultValue}", 
      1, 
      number(not(text())) * string-length("${defaultValue}")
  )
)`;

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
    itineraryCombinationReference: 'FlightsOverview/FlightRef',
    serviceClassReference: 'FlightsOverview/FlightRef/@PriceClassRef',
  }],
  itineraries: ['/S:Envelope/S:Body/AirShoppingRS/DataLists', {
    combinations: ['FlightList/Flight', {
      _id_: '@FlightKey',
      _items_: 'SegmentReferences',
    }],
    segments: ['FlightSegmentList/FlightSegment', {
      _id_: '@SegmentKey',
      origin: {
        locationType: textOrDefault(),
        iataCode: 'Departure/AirportCode',
      },
      destination: {
        locationType: () => textOrDefault(),
        iataCode: 'Arrival/AirportCode',
      },
      splittedDepartureTime: 'Departure/Time',
      splittedDepartureDate: 'Departure/Date',
      splittedArrivalTime: 'Arrival/Time',
      splittedArrivalDate: 'Arrival/Date',
    }],
  }],
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

const provideAirShoppingErrorsTransformTemplate = {
  errors: ['/S:Envelope/S:Body/AirShoppingRS/Errors/Error', {
    message: '@ShortText',
    code: '@Code',
  }]
};

module.exports = {
  provideAirShoppingTransformTemplate,
  provideAirShoppingErrorsTransformTemplate,
};
