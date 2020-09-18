const { v4: uuidv4 } = require('uuid');
const { createSegment, createPrice, createPassenger } = require('../utils/amadeusFormatUtils');


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

const transformResponse = (response) => {
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


  let passengersSet = {};
  //iterate over offers
  response.map(_flightOffer => {
    let { lastTicketingDate: _lastTicketingDate, itineraries: _itineraries, price: _price, travelerPricings: _travelerPricings } = _flightOffer;
    let offerItineraries = [];
    let segmentToItineraryMap = {};
    let offerSegments = [];
    //collect all segments and itineraries of an offer
    _itineraries.map(_itinerary => {
      let itinerarySegments = [];
      let itineraryId = 'itin-' + uuidv4();
      _itinerary.segments.map(_segment => {
        //build segment object
        let segment = createSegment(_segment);
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
    let currentOffer = createOffer('offer-' + uuidv4(), _lastTicketingDate, offerPrice, _flightOffer, offerSegments);

    //extract offer items (passengers)
    let offerItems = [];


    _travelerPricings.map(_travelerPricing => {
      let passenger = createPassenger(_travelerPricing);
      passengersSet[passenger._id_] = passenger;
      offerItems.push(createOfferItem('offeritem-' + uuidv4(), passenger._id_));
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
    _travelerPricing.fareDetailsBySegment.map(_fareSegmentDetail => {
      let brandedFareName = _fareSegmentDetail.brandedFare ? _fareSegmentDetail.brandedFare : _fareSegmentDetail.cabin;
      let itineraryId = segmentToItineraryMap[_fareSegmentDetail.segmentId];
      // console.log('brandedFareName=', brandedFareName, 'prevBrandedFareName=', prevBrandedFareName);
      if (prevBrandedFareName !== brandedFareName) {
        //new branded fare  - create new price plan
        let checkedBags = (_fareSegmentDetail.includedCheckedBags && _fareSegmentDetail.includedCheckedBags.quantity ? _fareSegmentDetail.includedCheckedBags.quantity : 0);
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
        currentPricePlan = createPricePlan('plan-' + uuidv4() + '-' + brandedFareName, brandedFareName, amenities, checkedBags);
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
    });
    // });

    searchResults.pricePlans.push(...offerPricePlans);  //store all newly created price plans in response

    searchResults.offers.push(currentOffer);

  });
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


module.exports.transformAmadeusResponse = transformResponse;
