const axios = require('axios');

const HotelProvider = require('../../hotelProvider');
const { erevmax: erevmaxConfiguration } = require('../../../../config');
const { manager: hotelsManager } = require('../../../models/mongo/hotels');
const GliderError = require('../../../error');
const offer = require('../../../models/offer');
const { v4: uuidv4 } = require('uuid');
const { revmaxRequest } = require('./revmaxUtils');
const { transform } = require('camaro');
const { reduceToObjectByKey, reduceObjectToProperty, reduceAccommodation } = require('../../../parsers');

//search templates
const { mapRequestData } = require('../../../transformInputData/hotelAvail');
const { hotelAvailRequestTemplate } = require('../../../soapTemplates/hotelAvail');
const { hotelAvailTransformTemplate, errorsTransformTemplate } = require('../../../camaroTemplates/hotelAvail');

//order create templates
const responseTemplate = require('../../../camaroTemplates/hotelResNotifRS').otaHotelResNotifRSTemplate;
const hotelResNotif = require('../../../transformInputData/hotelResNotif');
const {
  mapHotelResNotifSoap,
} = require('../../../soapTemplates/ota/otaHotelResNotifRQ');


module.exports = class HotelProviderRevMax extends HotelProvider {
  constructor () {
    super();
  }

  async searchByCircle (context, departure, arrival, locationCircle, guests) {
    let hotels = await hotelsManager.searchByLocation(locationCircle);
    return this.retrieveHotelsAvailability(context, hotels, departure, arrival, guests);
  }

  async searchByPolygon (context, departure, arrival, locationPolygon, guests) {
    let hotels = await hotelsManager.searchWithin(locationPolygon);
    return this.retrieveHotelsAvailability(context, hotels, departure, arrival, guests);
  }

  async searchByRectangle (context, departure, arrival, locationRectangle, guests) {
    const polygon = rectangleToPolygon(locationRectangle);
    let hotels = await hotelsManager.searchWithin(polygon);
    return await this.retrieveHotelsAvailability(context, hotels, departure, arrival, guests);
  }

  async retrieveHotelsAvailability (context, hotels, departure, arrival, guests) {
    if (hotels.total === 0) {
      throw new GliderError(
        'No Hotels were found with the provided criteria',
        404,
      );
    }
    const hotelCodes = hotels.records.map(r => r.ref);
    if (!hotelCodes.length) {
      throw new GliderError('No matching hotels', 404);
    }
    const guestCounts = getGuestCounts(guests);
    // Build the request
    const accommodation = { arrival: arrival, departure: departure };
    const requestData = mapRequestData(hotelCodes, { accommodation: accommodation, passengers: guests });
    const requestBody = hotelAvailRequestTemplate(requestData);
    let response = await revmaxRequest(erevmaxConfiguration.availabilityUrl, requestBody);
    const { errors } = await transform(response.data, errorsTransformTemplate);
    let searchResults;
    if (!errors.length) {

      /*
      throw new GliderError(
        errors.map(e => e.message).join('; '),
        502
      );
*/
      // Handle the search results if there are no errors
      searchResults = await transform(response.data, hotelAvailTransformTemplate);
    }

    // Go through the Room Stays to build the offers and gather the room types
    var accommodationRoomTypes = {};
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

    // Store the offers
    if (!process.env.TESTING) {
      /* istanbul ignore next */
      await offer.offerManager.storeOffers(offersToStore);
    }
    return { response: searchResults, errors: errors && errors.length ? errors : [] };
  }

  async createOrder (offer, passengers, card) {
    // Build the request
    const otaHotelResNotifRQData = hotelResNotif.mapFromOffer(offer, passengers, card);
    const otaRequestBody = mapHotelResNotifSoap(otaHotelResNotifRQData);

    let response;
    /* istanbul ignore next */
    response = await axios({
      method: 'post',
      url: erevmaxConfiguration.reservationUrl,
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
        'SOAPAction': 'http://www.opentravel.org/OTA/2003/05/getOTAHotelAvailability',
      },
      data: otaRequestBody,
    });

    if (response.status !== 200 || !response.data) {
      /* istanbul ignore if */
      console.log(JSON.stringify(otaRequestBody));
      response.data && console.log(JSON.stringify(response.data));
      throw new GliderError(
        `[erevmax:${response.status}] Booking creation failed`,
        502,
      );
    }


    // Transform the XML answer
    const responseData = await transform(response.data, responseTemplate);
    // If any error, send it
    if (responseData.errors.length > 0) {
      throw new GliderError(
        responseData.errors.map(e => e.message).join('; '),
        502,
      );
    }
    return responseData;

  }

  getProviderID () {
    return 'revmax';
  }
};


// Convert rectangle coordinates to polygon
const rectangleToPolygon = rectangle => [
  [
    rectangle.west,
    rectangle.north,
  ],
  [
    rectangle.east,
    rectangle.north,
  ],
  [
    rectangle.east,
    rectangle.south,
  ],
  [
    rectangle.west,
    rectangle.south,
  ],
].map(c => [Number(c[0]), Number(c[1])]);


// Get the Guest count
const getGuestCounts = passengers => {
  if (!passengers || !Array.isArray(passengers) || passengers.length === 0) {
    throw new GliderError('Passengers search property is required', 400);
  }

  const guestCounts = [
    new offer.GuestCount('ADT', 0),
    new offer.GuestCount('CHD', 0),
  ];

  for (let p of passengers) {
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
      400,
    );
  }

  return guestCounts;
};

