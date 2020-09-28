const { createSearchRequest, processSearchResponse } = require('./resolvers/searchHotelsRequestResponseConverters');
const { processOrderResponse, createOrderRequest } = require('./resolvers/orderCreateRequestResponseConverters');
const { convertPolygonToCircle } = require('./enclosingCircle');


const HotelProvider = require('../../hotelProvider');
const GliderError = require('../../../../helpers/error');
const offer = require('../../../models/offer');
const { assertAmadeusFault } = require('../../../amadeus/amadeusUtils');
const amadeusClient = require('../../../amadeus/amadeusUtils');

class HotelProviderAmadeus extends HotelProvider {
  constructor () {
    super();
  }

  async searchByCircle (context, departure, arrival, locationCircle, guests) {
    return this._searchHotel(context, locationCircle, departure, arrival, guests);
  }

  async searchByPolygon (context, departure, arrival, locationPolygon, guests) {
    return this._searchHotel(context, convertPolygonToCircle(locationPolygon), departure, arrival, guests);
  }

  async searchByRectangle (context, departure, arrival, locationRectangle, guests) {
    let { west, east, south, north } = locationRectangle;
    let polygon = [[west, north], [east, north], [east, south], [west, south]];
    return await this._searchHotel(context, convertPolygonToCircle(polygon), departure, arrival, guests);
  }

  async _searchHotel (context, location, departure, arrival, guests) {
    //Build the request
    const request = createSearchRequest(location, departure, arrival, guests);
    //Make a call to API endpoint
    let response = await amadeusClient.hotelSearch(request);
    assertAmadeusFault(response);
    //process response
    let searchResults = processSearchResponse(response);
    let offersToStore = [];
    let guestCounts = getGuestCounts(guests);
    Object.keys(searchResults.offers).forEach(offerId => {
      let accOffer = searchResults.offers[offerId];
      let pricePlan = getRatePlan(offerId, searchResults);
      offersToStore[offerId] = new offer.AccommodationOffer(
        this.getProviderID(),
        pricePlan ? pricePlan.accommodation : '',
        offerId,
        pricePlan ? pricePlan.roomType : '',
        [],
        guestCounts,
        'roomRate.effectiveDate',
        'roomRate.expireDate',
        accOffer.price.public,
        accOffer.price.public,
        accOffer.price.currency,
      );
    });
    await offer.offerManager.storeOffers(offersToStore);
    return searchResults;
  }

  async createOrder (offer, passengers, card) {
    let orderRequest = createOrderRequest(offer, passengers, card);
    let response = await amadeusClient.hotelBook(orderRequest);
    assertAmadeusFault(response);
    return processOrderResponse(response);
  }

  getProviderID () {
    return '1A';
  }
};

const getRatePlan = (offerId, results) => {
  let pricePlansReferences = results.offers[offerId].pricePlansReferences;
  let pricePlanRefId = Object.keys(pricePlansReferences)[0];
  let pricePlanRef = pricePlansReferences[pricePlanRefId];
  return Object.assign({ pricePlanRefId: pricePlanRefId }, pricePlanRef);
};


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
    throw new GliderError('At least one adult passenger is required to search properties', 400);
  }

  return guestCounts;
};


module.exports = { HotelProviderAmadeus };
