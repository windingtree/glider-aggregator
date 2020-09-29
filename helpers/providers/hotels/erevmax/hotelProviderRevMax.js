const HotelProvider = require('../../hotelProvider');
const { manager: hotelsManager } = require('../../../models/mongo/hotels');
const GliderError = require('../../../error');
const offer = require('../../../models/offer');
const { createSearchRequest, processSearchResponse, createHotelBookRequest, processHotelBookResponse, createHotelBookingCancellation, processHotelBookingCancellation } = require('./requestResponseConverters');
const { transform } = require('camaro');

//search templates
const { errorsTransformTemplate } = require('./camaroTemplates/hotelAvail');

//order create templates
const revmaxclient = require('./revmaxClient');


class HotelProviderRevMax extends HotelProvider {
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
      throw new GliderError('No Hotels were found with the provided criteria', 404);
    }
    const hotelCodes = hotels.records.map(r => r.ref);
    if (!hotelCodes.length) {
      throw new GliderError('No matching hotels', 404);
    }
    const guestCounts = getGuestCounts(guests);
    let requestBody = createSearchRequest(hotelCodes, arrival, departure, guests);
    let response = await revmaxclient.erevmaxHotelSearch(requestBody);
    await assertRevmaxErrors(response);
    let offersToStore = {};
    let searchResults = await processSearchResponse(response, guestCounts, offersToStore);

    context.offersToStore=offersToStore;
    return searchResults;
  }

  async createOrder (offer, passengers, card) {
    // Build the request
    let otaRequestBody = createHotelBookRequest(offer, passengers, card);

    let response = await revmaxclient.erevmaxHotelBook(otaRequestBody);
    await assertRevmaxErrors(response);
    let result = await processHotelBookResponse(response);
    //remove unnecessary properties
    delete result.success;
    delete result.errors;

    // Transform the XML answer
    return result;
  }

  async cancelOrder (order, offer, passengers, card) {
    const { order: { response, reservationNumber } } = order;
    let otaRequestBody = createHotelBookingCancellation(offer, passengers, card, reservationNumber);
    console.log('Request', JSON.stringify(otaRequestBody));
    let revMaxResponse = await revmaxclient.erevmaxHotelBookingCancel(otaRequestBody);
    await assertRevmaxErrors(revMaxResponse);
    let result = await processHotelBookingCancellation(revMaxResponse);
    let { response: resResponseType, reservationNumber: cancelledReservationId } = result;
    if (resResponseType !== 'Cancelled') {
      throw new GliderError(`Unrecognized resResponseType from provider - expected [Cancelled], received [${response}]`);
    }

    if (!cancelledReservationId || cancelledReservationId !== reservationNumber) {
      throw new GliderError(`Hotel provider did not provide cancelled reservationID, expected:${reservationNumber}, received:${cancelledReservationId}`);
    }
    //remove unnecessary properties
    delete result.success;
    delete result.errors;

    // Transform the XML answer
    return result;
  }

  getProviderID () {
    return 'revmax';
  }
};


const assertRevmaxErrors = async (response) => {
  const { errors } = await transform(response.data, errorsTransformTemplate);
  if (errors && errors.length > 0) {
    throw new GliderError(errors.map(e => e.message).join('; '), 502);
  }

  //just in case there is no response
  if (response.status !== 200 || !response.data) {
    throw new GliderError('Unknown error occurred', 502);
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
module.exports = { rectangleToPolygon, getGuestCounts, HotelProviderRevMax };
