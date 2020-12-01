const { v4: uuidv4 } = require('uuid');
const { createSegment, createPrice, createPassenger } = require('./amadeusFormatUtils');
const GliderError = require('../../../../error');
const { convertLocalAirportTimeToUtc } = require('../../../../utils/timezoneUtils');
const { getFeatureFlag } = require('../../../../../config');
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
      maxFlightOffers: getFeatureFlag('flights.amadeus.maxFlightOffers') || 100,
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
  let validatingCarriers = getFeatureFlag('flights.amadeus.validatingCarriers') || {};
  let { included, excluded } = validatingCarriers;
  if (included && included.length > 0) {
    if (included.length > 99) {
      console.warn('feature flights.amadeus.validatingCarriers.included is having too many items - Amadeus does not allow more than 99');
    }
    request.searchCriteria.flightFilters.carrierRestrictions.includedCarrierCodes = included;
  }
  if (excluded && excluded.length > 0) {
    if (excluded.length > 99) {
      console.warn('feature flights.amadeus.validatingCarriers.excluded is having too many items - Amadeus does not allow more than 99');
    }
    request.searchCriteria.flightFilters.carrierRestrictions.excludedCarrierCodes = excluded;
  }
  if (included && included.length > 0 && excluded && excluded.length > 0) {
    console.warn('Features flights.amadeus.validatingCarriers.excluded && flights.amadeus.validatingCarriers.included are mutually exclusive');
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


//iterate over all segments and load them into a map for later retrieval
/*
const createSegmentsMap = (flightOffers) => {
  let segmentsMap = {};
  flightOffers.map(flightOffer => {
    flightOffer.itineraries.map(itinerary => {
      itinerary.segments.map(segment => {
        segmentsMap[segment.id] = segment;
      });
    });
  });
  return segmentsMap;
};
*/

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
    // response.map(_flightOffer => {
    let {
      lastTicketingDate: _lastTicketingDate,
      itineraries: _itineraries,
      price: _price,
      travelerPricings: _travelerPricings,
      validatingAirlineCodes,
    } = _flightOffer;
    let validatingCarrierCode = (Array.isArray(validatingAirlineCodes) && validatingAirlineCodes.length > 0) ? validatingAirlineCodes[0] : undefined;
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
    let ancillaries = [];
    if (_price.additionalServices)
      _price.additionalServices.map(_additionalService => {
        if (_additionalService.type === 'CHECKED_BAGS')
          ancillaries.push('Checked bag for ' + _additionalService.amount);
      });

    //since amadeus repeats pricing for every passenger, in order to create pricePlans we only need 1st passenger
    let _travelerPricing = _travelerPricings[0];//.map(_travelerPricing => {
    let prevItineraryId;
    let prevBrandedFareName;
    let currentPricePlan;
    for (let _fareSegmentDetail of _travelerPricing.fareDetailsBySegment) {
      // _travelerPricing.fareDetailsBySegment.map(async _fareSegmentDetail => {
      let brandedFareName = _fareSegmentDetail.brandedFare ? _fareSegmentDetail.brandedFare : _fareSegmentDetail.cabin;
      let itineraryId = segmentToItineraryMap[_fareSegmentDetail.segmentId];
      // console.log('brandedFareName=', brandedFareName, 'prevBrandedFareName=', prevBrandedFareName);
      if (prevBrandedFareName !== brandedFareName) {
        //new branded fare  - create new price plan
        /* let checkedBags = (_fareSegmentDetail.includedCheckedBags && _fareSegmentDetail.includedCheckedBags.quantity ? _fareSegmentDetail.includedCheckedBags.quantity : 0);
         let amenities = [];
         if (_fareSegmentDetail.cabin === 'FIRST') amenities.push('First class');
         if (_fareSegmentDetail.cabin === 'PREMIUM_ECONOMY') amenities.push('Premium Economy class');
         if (_fareSegmentDetail.cabin === 'BUSINESS') amenities.push('Business class');
         if (_fareSegmentDetail.cabin === 'ECONOMY') amenities.push('Economy class');
         if (checkedBags === 0) amenities.push('Checked bags for a fee');
         if (checkedBags === 1) amenities.push('1st checked bag free');
         if (checkedBags === 2) amenities.push('2 checked bags free');
         if (ancillaries.length > 0)
           amenities.push(...ancillaries);
         currentPricePlan = createPricePlan(uuidv4() + '-' + brandedFareName, brandedFareName, amenities, checkedBags);*/

        // let fareSegment = segmentIdToSegmentMap[_fareSegmentDetail.segmentId];
        currentPricePlan = await translateAmenities(_fareSegmentDetail, validatingCarrierCode);
        offerPricePlans.push(currentPricePlan);
        currentOffer.pricePlansReferences.push(createPricePlansReference(currentPricePlan._id_));
      }

      if (prevItineraryId !== itineraryId) {
        offerItineraries.push(itineraryId);
        // console.log('currentOffer.pricePlansReferences.length=', currentOffer.pricePlansReferences.length);
        currentOffer.pricePlansReferences[currentOffer.pricePlansReferences.length - 1].flights.push(itineraryId);
      }
      prevItineraryId = itineraryId;
      prevBrandedFareName = brandedFareName;
    }
    ;
    // });

    searchResults.pricePlans.push(...offerPricePlans);  //store all newly created price plans in response

    searchResults.offers.push(currentOffer);

  }
  ;
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


const translateAmenities = async (_fareSegmentDetail, carrierCode) => {
  let { cabin, brandedFare: brandedFareId, includedCheckedBags } = _fareSegmentDetail;
  console.log(`translateAmenities, carrierCode:${carrierCode}, branded fare code:${brandedFareId}`);
  let brandedFareName;
  let amenities = [];
  let predefinedAmenities = [];

  //if we have brandedFareID (e.g. FLEX/COMFORT), try to find it's definition in mongo (carrier configuration)
  if (brandedFareId) {
    let fareFamilyDefinition = await getFareFamily(carrierCode, brandedFareId);

    //if we have definition of branded fare in mongo, retrieve it's details from there (fare name, amenities, etc)
    if (fareFamilyDefinition) {
      brandedFareName = fareFamilyDefinition.brandedFareName;
      // checkedBags=fareFamilyDefinition.checkedBaggages.quantity;
      predefinedAmenities.push(fareFamilyDefinition.amenities);
      // refundable=fareFamilyDefinition.refundable;
    }
  }

  if (!brandedFareName) {
    brandedFareName = brandedFareId ? brandedFareId : cabin;
  }

  //if we took branded fare and amenities from mongo - use that. Otherwise create amenities
  if (predefinedAmenities.length > 0) {
    amenities = [...predefinedAmenities];
  } else {
    if (cabin === 'FIRST') amenities.push('First class');
    if (cabin === 'PREMIUM_ECONOMY') amenities.push('Premium Economy class');
    if (cabin === 'BUSINESS') amenities.push('Business class');
    if (cabin === 'ECONOMY') amenities.push('Economy class');
  }

  if (includedCheckedBags === 0) {
    amenities.push('Checked bags for a fee');
  } else if (includedCheckedBags === 1) {
    amenities.push('1 checked bag included');
  } else {
    amenities.push(`${includedCheckedBags} checked bags included`);
  }
  // if (ancillaries.length > 0)
  //   amenities.push(...ancillaries);
  let currentPricePlan = createPricePlan(uuidv4() + '-' + brandedFareName, brandedFareName, amenities, includedCheckedBags);
  return currentPricePlan;
};


module.exports = { processFlightSearchResponse, createFlightSearchRequest };
