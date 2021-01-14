const { v4: uuidv4 } = require('uuid');
const { createSegment, createPrice, createPassenger } = require('./amadeusFormatUtils');
const GliderError = require('../../../../error');
const { convertLocalAirportTimeToUtc } = require('../../../../utils/timezoneUtils');
const { getConfigKey, getConfigKeyAsArray } = require('../../../../../config');
const { getFareFamily } = require('../../../../models/carrierConfigManager');

//request

const splitIsoDateTime = (isoDateString) => {
  return { 'date': isoDateString.substr(0, 10), 'time': isoDateString.substr(11, 8) };
};

const convertPassengerTypeToAmadeus = (type) => {
  if (type === 'ADT') return 'ADULT';
  else if (type === 'CHD') return 'CHILD';
  else if (type === 'INF') return 'HELD_INFANT';
  else throw new GliderError('invalid passenger type:' + type, 400);
};


const createFlightSearchRequest = (itinerary, passengers) => {
  // const { itinerary, passengers } = body;
  //transform itinerary criteria to Amadeus format
  let itineraryId = 1;
  const originDestinations = itinerary.segments.map(segment => {
    let { date } = splitIsoDateTime(segment.departureTime);
    return {
      id: itineraryId++,
      originLocationCode: segment.origin.iataCode,
      destinationLocationCode: segment.destination.iataCode,
      departureDateTimeRange: { date: date },
    };
  });

  //transform passenger details to too
  let paxId = 1;
  let travelers = [];
  passengers.forEach(passenger => {
    const { type, count = 1 } = passenger;
    for (let i = 0; i < count; i++) {
      travelers.push({
        id: paxId++,
        travelerType: convertPassengerTypeToAmadeus(type),
      });
    }
  });
  //in case we have infants, we need to also indicate which adult passenger will be associated with a given infant
  let adults = travelers.filter(pax => pax.travelerType === 'ADULT');
  let infantsOnLap = travelers.filter(pax => pax.travelerType === 'HELD_INFANT');
  if (infantsOnLap.length > 0) {
    //if we have more infants than adults - fail, it's not possible to duplicate same accompanying adult for two infants
    if (infantsOnLap.length > adults.length)
      throw new GliderError('Number of infant passengers cannot be greater than adults', 500);
    for (let i = 0; i < infantsOnLap.length; i++) {
      let infant = infantsOnLap[i];
      infant.associatedAdultId = adults[i].id;
    }
  }


  let request = {
    // currencyCode: 'USD', //TODO remove hardcoded currency code
    originDestinations: originDestinations,
    travelers: travelers,
    sources: [
      'GDS',
    ],
    searchCriteria: {
      maxFlightOffers: getConfigKey('flights.amadeus.maxFlightOffers', 100),
      excludeAllotments: true,
      additionalInformation: {
        brandedFares: true,
      },
      flightFilters: {
        returnToDepartureAirport: true,
        railSegmentAllowed: false,
        busSegmentAllowed: false,
        carrierRestrictions: {},
      },
      connectionRestriction: {
        airportChangeAllowed: false,
      },
    },
  };
  //check if we need to include or exclude certain validating carriers
  let validatingCarriers = getConfigKeyAsArray('flights.amadeus.validatingCarriers', []);
  console.log('validating carriers requested:', validatingCarriers);
  if (validatingCarriers && validatingCarriers.length > 0) {
    if (validatingCarriers.length > 99) {
      console.warn('feature flights.amadeus.validatingCarriers.included is having too many items - Amadeus does not allow more than 99');
    }
    request.searchCriteria.flightFilters.carrierRestrictions.includedCarrierCodes = validatingCarriers;
  }
  return request;
};


//response

const createOfferItem = (offerItemId, passengerId) => {
  return {
    _id_: offerItemId,
    _value_: {
      passengerReferences: passengerId,
    },
  };
};
const createPricePlansReference = (pricePlanRefId) => {
  return {
    _id_: pricePlanRefId,
    flights: [],
  };
};
const createOffer = (offerId, expiryDate, price, rawOffer, offerSegments) => {
  return {
    _id_: offerId,
    offerItems: [],
    expiration: '',
    price: price,
    pricePlansReferences: [],
    extraData: {
      rawOffer: rawOffer,
      segments: offerSegments,
    },
  };
};

const createPricePlan = (planId, pricePlanName, amenities, checkBagsIncluded) => {
  return {
    _id_: planId,
    name: pricePlanName,
    amenities: amenities,
    checkedBaggages: checkBagsIncluded,
  };
};
const createCombination = (itineraryId, segments) => {
  let segs = segments.map(segment => segment._id_).join(' ');
  return {
    _id_: itineraryId,
    _items_: segs,
  };
};



const processFlightSearchResponse = async (response) => {
  let searchResults = {
    offers: [],
    itineraries: {
      combinations: [],
      segments: [],
    },
    pricePlans: [],
    passengers: [],
    // destinations: [],
  };

  // let segmentIdToSegmentMap = createSegmentsMap(response);

  let passengersSet = {};
  //iterate over offers
  for (let _flightOffer of response) {
    let {
      lastTicketingDate: _lastTicketingDate,
      itineraries: _itineraries,
      price: _price,
      travelerPricings: _travelerPricings,
    } = _flightOffer;
    let validatingCarrierCode = detectMarketingCarrierCode(_itineraries);
    let offerItineraries = [];
    let segmentToItineraryMap = {};
    let offerSegments = [];
    //collect all segments and itineraries of an offer
    _itineraries.map(_itinerary => {
      let itinerarySegments = [];
      let itineraryId = uuidv4();
      _itinerary.segments.map(_segment => {
        //build segment object
        let segment = createSegment(_segment);
        segment.departureTime = convertLocalAirportTimeToUtc(segment.departureTime, segment.origin.iataCode);
        segment.arrivalTime = convertLocalAirportTimeToUtc(segment.arrivalTime, segment.destination.iataCode);
        itinerarySegments.push(segment);
        segmentToItineraryMap[_segment.id] = itineraryId;
        offerSegments.push(segment);  //store this as 'extraData' for post-processing of offer price call
      });
      searchResults.itineraries.segments.push(...itinerarySegments);
      //build itinerary (collection of segment refs)
      offerItineraries.push(createCombination(itineraryId, itinerarySegments));
    });
    searchResults.itineraries.combinations.push(...offerItineraries);

    //TODO - add commission calculation
    let offerPrice = createPrice(_price);
    let currentOffer = createOffer(uuidv4(), _lastTicketingDate, offerPrice, _flightOffer, offerSegments);

    //extract offer items (passengers)
    let offerItems = [];
    _travelerPricings.map(_travelerPricing => {
      let passenger = createPassenger(_travelerPricing);
      passengersSet[passenger._id_] = passenger;
      offerItems.push(createOfferItem(uuidv4(), passenger._id_));
    });
    currentOffer.offerItems.push(...offerItems);
    //extract price plans
    let offerPricePlans = [];
    // let ancillaries = [];
    //since amadeus repeats pricing for every passenger, in order to create pricePlans we only need 1st passenger
    let _travelerPricing = _travelerPricings[0];//.map(_travelerPricing => {
    let prevItineraryId = undefined;
    let prevBrandedFareName = undefined;
    let currentPricePlan;
    for (let _fareSegmentDetail of _travelerPricing.fareDetailsBySegment) {
      let brandedFareName = _fareSegmentDetail.brandedFare ? _fareSegmentDetail.brandedFare : _fareSegmentDetail.cabin;
      let itineraryId = segmentToItineraryMap[_fareSegmentDetail.segmentId];
      if (prevBrandedFareName !== brandedFareName) {
        //new branded fare  - create new price plan
        currentPricePlan = await translateAmenities(_fareSegmentDetail, validatingCarrierCode);
        offerPricePlans.push(currentPricePlan);
        let pricePlanReference = createPricePlansReference(currentPricePlan._id_);
        pricePlanReference.flights.push(itineraryId);
        currentOffer.pricePlansReferences.push(pricePlanReference);
      }

      if (prevItineraryId !== itineraryId) {
        offerItineraries.push(itineraryId);
        currentOffer.pricePlansReferences[currentOffer.pricePlansReferences.length - 1].flights.push(itineraryId);
      }
      prevItineraryId = itineraryId;
      prevBrandedFareName = brandedFareName;
    }
    searchResults.pricePlans.push(...offerPricePlans);  //store all newly created price plans in response
    searchResults.offers.push(currentOffer);
  }
  for (const passengerId of Object.keys(passengersSet)) {
    searchResults.passengers.push(passengersSet[passengerId]);
  }
  searchResults.offers.map(offer => {
    offer.pricePlansReferences.map(pricePlansReference => {
      pricePlansReference.flights = pricePlansReference.flights.join(' ');
    });
  });
  return searchResults;
};

//naive way to find marketing carrier based on first segment
const detectMarketingCarrierCode = (itineraries) => {
  let carrierCodes = [];
  itineraries.forEach(itinerary => {
    itinerary.segments.forEach(segment => {
      let rec = {
        carrier: segment.carrierCode,
      };
      carrierCodes.push(rec);
    });
  });

  return carrierCodes.length > 0 ? carrierCodes[0].carrier : null;
};
const translateAmenities = async (_fareSegmentDetail, carrierCode) => {
  let { cabin, brandedFare: brandedFareId, includedCheckedBags } = _fareSegmentDetail;

  let brandedFareName;
  let amenities = [];
  let predefinedAmenities = [];


  //if we have brandedFareID (e.g. FLEX/COMFORT), try to find it's definition in mongo (carrier configuration)
  if (brandedFareId) {
    let fareFamilyDefinition = await getFareFamily(carrierCode, brandedFareId);
    if (!fareFamilyDefinition) {
      console.log(`Branded fare definition not found, carrierCode:${carrierCode}, branded fare code:${brandedFareId}`);
    } else {
      console.log(`Branded fare definition found, carrierCode:${carrierCode}, branded fare code:${brandedFareId} ==> ${fareFamilyDefinition.brandedFareName}`);
    }
    //if we have definition of branded fare in mongo, retrieve it's details from there (fare name, amenities, etc)
    if (fareFamilyDefinition) {
      brandedFareName = fareFamilyDefinition.brandedFareName;
      // checkedBags=fareFamilyDefinition.checkedBaggages.quantity;
      predefinedAmenities = predefinedAmenities.concat(fareFamilyDefinition.amenities);
      // refundable=fareFamilyDefinition.refundable;
    }
  }

  if (!brandedFareName) {
    brandedFareName = brandedFareId ? brandedFareId : cabin;
  }

  //if we took branded fare and amenities from mongo - use that. Otherwise create amenities
  if (predefinedAmenities.length > 0) {
    amenities = amenities.concat(predefinedAmenities);
  } else {
    if (cabin === 'FIRST') amenities.push('First class');
    if (cabin === 'PREMIUM_ECONOMY') amenities.push('Premium Economy class');
    if (cabin === 'BUSINESS') amenities.push('Business class');
    if (cabin === 'ECONOMY') amenities.push('Economy class');
  }
  let includedCheckedBagsQuantity = includedCheckedBags ? includedCheckedBags.quantity : 0;
  if (includedCheckedBagsQuantity === 0) {
    amenities.push('Checked bags for a fee');
  } else if (includedCheckedBagsQuantity === 1) {
    amenities.push('1 checked bag included');
  } else {
    amenities.push(`${includedCheckedBagsQuantity} checked bags included`);
  }
  return createPricePlan(uuidv4() + '-' + brandedFareName, brandedFareName, amenities, includedCheckedBags);
};


module.exports = { processFlightSearchResponse, createFlightSearchRequest };
