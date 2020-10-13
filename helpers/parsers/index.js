// const parse = require('date-fns/parse');
const { convertLocalAirportTimeToUtc } = require('../utils/timezoneUtils');

module.exports.reduceObjectToProperty = (array, property) => Object.entries(array)
  .reduce(
    (result, [key, value]) => ({
      ...result,
      [key]: value[property],
    }),
    {},
  );

module.exports.splitPropertyBySpace = (array, property) => array
  .map(
    (element) => ({
      ...element,
      [property]: element[property].split(' '),
    }),
  );

module.exports.reduceContactInformation = (passengers) => passengers
  .map(
    (passenger) => {
      const emails = passenger.contactInformation && Array.isArray(passenger.contactInformation.emails)
        ? passenger.contactInformation.emails.map(({ value }) => value)
        : [];
      const phones = passenger.contactInformation && Array.isArray(passenger.contactInformation.phones)
        ? passenger.contactInformation.phones.map(({ value }) => value)
        : [];
      return {
        ...passenger,
        contactInformation: emails.concat(phones),
      };
    },
  );

module.exports.useDictionary = (array, object, keyToReplace) => array
  .map(
    (element) => ({
      ...element,
      [keyToReplace]: object[element[keyToReplace]],
    }),
  );

module.exports.mergeHourAndDate = array => array
  .map(
    ({
      splittedDepartureDate,
      splittedDepartureTime,
      splittedArrivalDate,
      splittedArrivalTime,
      origin,
      destination,
      ...others
    }) => ({
      ...others,
      origin,
      destination,
      departureTime: convertLocalAirportTimeToUtc(
        `${splittedDepartureDate} ${splittedDepartureTime}:00.000`,
        origin.iataCode,
      ).toISOString(),
      arrivalTime: convertLocalAirportTimeToUtc(
        `${splittedArrivalDate} ${splittedArrivalTime}:00.000`,
        destination.iataCode,
      ).toISOString(),
    }),
  );


module.exports.reduceToProperty = (object, property) => Object.keys(object)
  .map((key) => {
    return {
      [key]: object[key][property],
    };
  });

/* istanbul ignore next */
module.exports.splitSegments = (combinations) => combinations
  .map(
    ({ _items_, ...others }) => ({
      ...others,
      _items_: _items_.split(' '),
    }),
  );

/**
 * Convert an array of objects (each having '_id_' property), into associative array which key is '_id_' and value is object that had '_id_' property.
 * Example:
 * input: [{_id_:'Key1',name:'Object1'},{_id_:'Key2',name:'Object2'}]
 * output: {'Key1':{name:'Object1'},'Key2':{name:'Object2'}}
 *
 * @param array
 * @return {*}
 */
module.exports.reduceToObjectByKey = (array) => array
  .reduce(
    (segments, { _id_, ...others }) => ({
      ...segments,
      [_id_]: others,
    }),
    {},
  );

module.exports.roundCommissionDecimals = (offers) => offers
  .map(
    ({ price, ...others }) => ({
      ...others,
      price: {
        ...price,
        commission: price.commission.toFixed(2).toString(),
      },
    }),
  );

module.exports.reduceAccommodation = (accommodation) => accommodation
  .reduce(
    (ac, { _provider_, _id_, ...others }) => {
      const key = `${_provider_}.${_id_}`;
      return {
        ...ac,
        [key]: others,
      };
    },
    {},
  );

/* istanbul ignore next */
module.exports.reduceRoomStays = (_roomStays_ => {
  // The offer dicts will contain all offers
  let offers = {};
  _roomStays_.forEach(roomStay => {

    // Create the accommodation key
    let accommodationReference = `${roomStay._provider_}.${roomStay._hotelCode_}`;

    // Build the offers by parsing the room rates
    roomStay._roomRates_.forEach(roomRate => {

      // Build the offer key
      let offerKey = `${accommodationReference}.${roomRate.ratePlanReference}.${roomRate.roomTypeReference}`;

      // Build the PricePlanReference
      let pricePlanReference = {
        accommodation: accommodationReference,
        roomType: roomRate.roomTypeReference,
      };
      let pricePlansReferences = {};
      pricePlansReferences[roomRate.ratePlanReference] = pricePlanReference;

      let offer = {
        // Reference from other elements
        pricePlansReferences: pricePlansReferences,

        // Build price
        price: {
          currency: roomRate.price.currency,
          public: roomRate.price._afterTax_,
          taxes: new Number(roomRate.price._afterTax_) - new Number(roomRate.price._beforeTax_),
        },
      };

      // Add the offer item to the offers dict
      offers[offerKey] = offer;
    });
  });
  return offers;
});

// Deep merge of two objects
const deepMerge = (target, source) => {

  for (const key of Object.keys(source)) {

    if (source[key].constructor === Object && target[key]) {
      Object.assign(source[key], deepMerge(target[key], source[key]));
    } else {
      target[key] = source[key];
    }
  }

  return Object.assign(target || {}, source);
};
module.exports.deepMerge = deepMerge;
