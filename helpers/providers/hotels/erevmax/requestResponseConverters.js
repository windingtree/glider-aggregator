const offer = require('../../../models/offer');
const { v4: uuidv4 } = require('uuid');
const { transform } = require('camaro');
const { reduceToObjectByKey, reduceObjectToProperty, reduceAccommodation } = require('../../../parsers');
//search templates
const { mapRequestData } = require('./transformInputData/hotelAvail');
const { hotelAvailRequestTemplate } = require('./soapTemplates/hotelAvail');
const { hotelAvailTransformTemplate } = require('./camaroTemplates/hotelAvail');

//order create templates
const responseTemplate = require('./camaroTemplates/hotelResNotifRS').otaHotelResNotifRSTemplate;
const { mapBookRequest, mapCancelRequest } = require('./transformInputData/hotelResNotif');
const { logRQRS } = require('../../../log/logRQ');
const { mapHotelResNotifSoap } = require('./camaroTemplates/ota/otaHotelResNotifRQ');


//build searh request
const createSearchRequest = (hotelCodes, arrival, departure, guests) => {
  // Build the request
  const accommodation = { arrival: arrival, departure: departure };
  const requestData = mapRequestData(hotelCodes, { accommodation: accommodation, passengers: guests });
  const requestBody = hotelAvailRequestTemplate(requestData);
  return requestBody;
};

const processSearchResponse = async (response, guestCounts, offersToStore) => {
// Handle the search results if there are no errors
  let searchResults = await transform(response.data, hotelAvailTransformTemplate);
  logRQRS(searchResults, 'search_results_raw');
  // Go through the Room Stays to build the offers and gather the room types
  const accommodationRoomTypes = {};
  const offers = {};
  // let offersToStore = {};
  searchResults._roomStays_.forEach(roomStay => {

    // Create the accommodation key
    let accommodationReference = `${roomStay._provider_}.${roomStay._hotelCode_}`;

    // Handle the room types
    for (const roomType of roomStay._roomTypes_) {
      // Reduce the policies
      roomType.policies = reduceToObjectByKey(roomType.policies);
      roomType.policies = reduceObjectToProperty(roomType.policies, '_value_');

      // Add the room type to the dict that will be used when building accommodation
      if (!(accommodationRoomTypes[accommodationReference])) {
        accommodationRoomTypes[accommodationReference] = {};
      }
      accommodationRoomTypes[accommodationReference][roomType._id_] = roomType;
      delete (accommodationRoomTypes[accommodationReference][roomType._id_]._id_);
    }

    // Handle the Rate Plans
    searchResults.pricePlans = reduceToObjectByKey(roomStay._ratePlans_);
    delete (roomStay._ratePlans_);

    // Build the offers by parsing the room rates
    roomStay._roomRates_.forEach(roomRate => {
      // Build the PricePlanReference
      const pricePlanReference = {
        accommodation: accommodationReference,
        roomType: roomRate.roomTypeReference,
      };
      const pricePlansReferences = {};
      pricePlansReferences[roomRate.ratePlanReference] = pricePlanReference;

      // Build the offer
      const providerOffer = {
        // Reference from other elements
        pricePlansReferences,

        // Build price
        price: {
          currency: roomRate.price.currency,
          public: roomRate.price._afterTax_,
          taxes: new Number(roomRate.price._afterTax_) - new Number(roomRate.price._beforeTax_),
        },
      };

      // Build the detailed rates
      let rates = [];
      for (const rate of roomRate.rates) {
        rates.push(new offer.Rate(
          rate.effectiveDate,
          rate.expireDate,
          rate.rateTimeUnit,
          rate.unitMultiplier === undefined ? '1' : rate.unitMultiplier,
          rate.currencyCode,
          rate.amountAfterTax,
        ));
      }

      // Add the offer in the list of offers to store
      let offerId = uuidv4();
      offersToStore[offerId] = new offer.AccommodationOffer(
        'revmax',
        roomStay._hotelCode_,
        roomRate.ratePlanReference,
        roomRate.roomTypeReference,
        rates,
        guestCounts,
        roomRate.effectiveDate,
        roomRate.expireDate,
        roomRate.price._beforeTax_,
        roomRate.price._afterTax_,
        roomRate.price.currency,
      );

      // Add the offer indexed by quote ID
      offers[offerId] = providerOffer;
    });
  });
  // Parse the accommodations
  for (let accommodation of searchResults.accommodations) {

    // Build the accommodation reference key
    var accommodationReference = `${accommodation._provider_}.${accommodation._id_}`;

    // Reduce the policies
    accommodation.otherPolicies = reduceToObjectByKey(accommodation.otherPolicies);
    accommodation.otherPolicies = reduceObjectToProperty(accommodation.otherPolicies, '_value_');

    // Add the room types gathered from Room Rates
    accommodation.roomTypes = accommodationRoomTypes[accommodationReference];

  }

  searchResults.accommodations = reduceAccommodation(searchResults.accommodations);

  searchResults.offers = offers;
  delete (searchResults._roomStays_);

  return searchResults;
};

const createHotelBookRequest = (offer, passengers, card) => {
  const otaHotelResNotifRQData = mapBookRequest(offer, passengers, card);
  return mapHotelResNotifSoap(otaHotelResNotifRQData);
};
const processHotelBookResponse = async (response) => {
  return await transform(response.data, responseTemplate);
};

const createHotelBookingCancellation = (offer, passengers, card, reservationNumber) => {
  const otaHotelResNotifRQData = mapCancelRequest(offer, passengers, card, reservationNumber);
  return mapHotelResNotifSoap(otaHotelResNotifRQData);
};
const processHotelBookingCancellation = async (response) => {
  return await transform(response.data, responseTemplate);
};

module.exports = {
  createSearchRequest,
  createHotelBookRequest,
  processSearchResponse,
  processHotelBookResponse,
  createHotelBookingCancellation,
  processHotelBookingCancellation,
};
