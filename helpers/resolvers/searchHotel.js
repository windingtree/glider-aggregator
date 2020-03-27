const axios = require('axios');
const { transform } = require('camaro');
const { v4: uuidv4 } = require('uuid');
const { mapRequestData } = require('../transformInputData/hotelAvail');
const { hotelAvailRequestTemplate } = require('../soapTemplates/hotelAvail');
const {
  hotelAvailTransformTemplate,
  errorsTransformTemplate
} = require('../camaroTemplates/hotelAvail');
const {
  reduceToObjectByKey,
  reduceObjectToProperty,
  reduceAcomodation
} = require('../parsers');
const { manager: hotelsManager } = require('../models/mongo/hotels');

const GliderError = require('../error');
const offer = require('../models/offer');
const config = require('../../config');

const searchHotel = async (body) => {
  let hotels;

  if (typeof body.accommodation.location.circle === 'object') {
    hotels = await hotelsManager.searchByLocation(body.accommodation.location.circle);
  } else if (Array.isArray(body.accommodation.location.polygon)) {
    hotels = await hotelsManager.searchWithin(body.accommodation.location.polygon);
  } else if (typeof body.accommodation.location.rectangle === 'object') {
    const polygon = [
      [
        body.accommodation.location.rectangle.north,
        body.accommodation.location.rectangle.west
      ],
      [
        body.accommodation.location.rectangle.north,
        body.accommodation.location.rectangle.east
      ],
      [
        body.accommodation.location.rectangle.south,
        body.accommodation.location.rectangle.east
      ],
      [
        body.accommodation.location.rectangle.south,
        body.accommodation.location.rectangle.west
      ]
    ];
    hotels = await hotelsManager.searchWithin(polygon);
  } else {
    throw new GliderError(
      'A location area of type rectangle, circle or polygon is required',
      400
    );
  }

  if (hotels.total === 0) {
    throw new GliderError(
      'No Hotels were found with the provided criteria',
      404
    );
  }

  const hotelCodes = hotels.records.map(r => r.ref);
  
  if (!hotelCodes.length) {
    throw new GliderError('No matching hotels', 404);
  }

  // Get the Guest count
  var guestCounts = [
    new offer.GuestCount('ADT', 0),
    new offer.GuestCount('CHD', 0),
  ];

  if (!body.passengers.length) {
    throw new GliderError('Missing passenger types', 400);
  }

  for (let p of body.passengers) {
    let newCount = p.count === undefined ? 1 : Number(p.count);
    if (p.type === 'ADT') {
      guestCounts[0].count += newCount;
    } else if (p.type === 'CHD') {
      guestCounts[1].count += newCount;
    } else {
      throw new GliderError('Unsupported passenger type', 400);
    }
  }

  if (guestCounts[0].count === 0) {
    throw new GliderError(
      'At least one adult passenger is required to search properties',
      400
    );
  }

  // Build the request
  const requestData = mapRequestData(hotelCodes, body);
  const requestBody = hotelAvailRequestTemplate(requestData);

  // Fire the request
  const response = await axios.post(
    config.erevmax.availabilityUrl,
    requestBody, {
      headers: {
        'Content-Type': 'application/xml',
        SOAPAction: 'http://www.opentravel.org/OTA/2003/05/getOTAHotelAvailability',
      },
    });

  // Handle any errors returned from the API
  const { errors } = await transform(response.data, errorsTransformTemplate);

  if (errors.length) {
    throw new GliderError(
      errors.map((e => e.message).join('; ')),
      502
    );
  }

  // Handle the search results
  const searchResults = await transform(response.data, hotelAvailTransformTemplate);

  // Go through the Room Stays to build the offers and gather the room types
  var accomodationRoomTypes = {};
  var offers = {};
  let offersToStore = {};
  searchResults._roomStays_.forEach(roomStay => {

    // Create the accommodation key
    var accommodationReference = `${roomStay._provider_}.${roomStay._hotelCode_}`;

    // Handle the room types
    for (const roomType of roomStay._roomTypes_) {
      // Reduce the policies
      roomType.policies = reduceToObjectByKey(roomType.policies);
      roomType.policies = reduceObjectToProperty(roomType.policies, '_value_');

      // Add the room type to the dict that will be used when building accomodation
      if (!(accomodationRoomTypes[accommodationReference])) {
        accomodationRoomTypes[accommodationReference] = {};
      }
      accomodationRoomTypes[accommodationReference][roomType._id_] = roomType;
      delete(accomodationRoomTypes[accommodationReference][roomType._id_]._id_);
    }

    // Handle the Rate Plans
    searchResults.pricePlans = reduceToObjectByKey(roomStay._ratePlans_);
    delete(roomStay._ratePlans_);

    // Build the offers by parsing the room rates
    roomStay._roomRates_.forEach(roomRate => {

      // Build the offer key
      var offerKey = `${accommodationReference}.${roomRate.ratePlanReference}.${roomRate.roomTypeReference}`;// @todo What is it?

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
      var rates = [];
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
        roomStay._provider_,
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

  // Parse the accomodations
  for (var accommodation of searchResults.accommodations) {

    // Build the accomodation reference key
    var accommodationReference = `${accommodation._provider_}.${accommodation._id_}`;

    // Reduce the policies
    accommodation.otherPolicies = reduceToObjectByKey(accommodation.otherPolicies);
    accommodation.otherPolicies = reduceObjectToProperty(accommodation.otherPolicies, '_value_');

    // Add the room types gathered from Room Rates
    accommodation.roomTypes = accomodationRoomTypes[accommodationReference];

  }
  searchResults.accommodations = reduceAcomodation(searchResults.accommodations);

  searchResults.offers = offers;
  delete(searchResults._roomStays_);

  // Store the offers
  await offer.offerManager.storeOffers(offersToStore);

  // Hotels require only the main passenger
  searchResults.passengers = {
    PAX1: {
      type: 'ADT'
    }
  };

  return searchResults;
};

module.exports = {
  searchHotel,
};
