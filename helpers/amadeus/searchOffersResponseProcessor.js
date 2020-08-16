// const data = require('./1A-raw-response-searchoffers.json');
const { v4: uuidv4 } = require('uuid');
// const GliderError = require('../error');
const { createSegment, createPrice, createPassenger } = require('./utils');


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
const createOffer = (offerId, expiryDate, price, rawOffer,offerSegments) => {
  return {
    _id_: offerId,
    offerItems: [],
    expiration: '',
    price: price,
    pricePlansReferences: [],
    extraData:{
      rawOffer:rawOffer,
      segments:offerSegments
    }
  };
};
// const createPrice = (price) => {
//   const { grandTotal, currency } = price;
//   const commission = 0; //TODO calculate commission
//   //calculate offer price
//   let tax = price.fees.reduce((total, taxItem) => {
//     return total + Number(taxItem.amount);
//   }, 0);
//
//   return {
//     currency: currency,
//     public: grandTotal,
//     commission: commission,
//     taxes: Number(tax).toFixed(2),
//   };
// };
const createPricePlan = (planId, pricePlanName, amenities, checkBagsIncluded) => {
  return {
    _id_: planId,
    name: pricePlanName,
    amenities: amenities,
    checkedBaggages: checkBagsIncluded,
  };
};
// const createSegment = (segmentId, segment) => {
//   const { carrierCode: marketingCarrier, operating, number: flightNumber, departure, arrival } = segment;
//   const { iataCode: originIataCode, at: departureTime } = departure;
//   const { iataCode: destinationIataCode, at: arrivalTime } = arrival;
//   const operatingCarrier = operating ? operating.carrierCode : marketingCarrier;
//   return {
//     _id_: segmentId,
//     operator: {
//       operatorType: 'airline',
//       iataCode: operatingCarrier,
//       iataCodeM: marketingCarrier,
//       flightNumber: flightNumber,
//     },
//     origin: {
//       locationType: 'airport',
//       iataCode: originIataCode,
//     },
//     destination: {
//       locationType: 'airport',
//       iataCode: destinationIataCode,
//     },
//     departureTime: departureTime,
//     arrivalTime: arrivalTime,
//     Departure: {
//       AirportCode: originIataCode,
//       // Date: 2020-09-13,
//       // Time: 10:15,
//       // Terminal: {
//       //   Name:
//       // }
//     },
//     Arrival: {
//       AirportCode: destinationIataCode,
//       // Date: 2020-09-13,
//       // Time: 12:05,
//       // Terminal: {
//       //   Name:
//       // }
//     },
//   };
// };
const createCombination = (itineraryId, segments) => {
  let segs = segments.map(segment => segment._id_).join(' ');
  return {
    _id_: itineraryId,
    _items_: segs,
  };
};

const searchOffersResponseProcessor = (response) => {
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
        let segment = createSegment('seg-' + uuidv4(), _segment);
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
    let currentOffer = createOffer('offer-' + uuidv4(), _lastTicketingDate, offerPrice, _flightOffer,offerSegments);


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

    _travelerPricings.map(_travelerPricing => {
      let prevItineraryId;
      let prevBrandedFareName;
      let currentPricePlan;
      _travelerPricing.fareDetailsBySegment.map(_fareSegmentDetail => {
        let brandedFareName = _fareSegmentDetail.brandedFare;
        let itineraryId = segmentToItineraryMap[_fareSegmentDetail.segmentId];
        if (prevBrandedFareName !== brandedFareName) {
          //new branded fare  - create new price plan
          let checkedBags = (_fareSegmentDetail.includedCheckedBags && _fareSegmentDetail.includedCheckedBags.quantity ? _fareSegmentDetail.includedCheckedBags.quantity : 0);

          currentPricePlan = createPricePlan('plan-' + uuidv4() + '-' + brandedFareName, brandedFareName, [], checkedBags);
          offerPricePlans.push(currentPricePlan);
          currentOffer.pricePlansReferences.push(createPricePlansReference(currentPricePlan._id_));
        }

        if (prevItineraryId !== itineraryId) {
          offerItineraries.push(itineraryId);
          currentOffer.pricePlansReferences[currentOffer.pricePlansReferences.length - 1].flights.push(itineraryId);
        }
        prevItineraryId = itineraryId;
        prevBrandedFareName = brandedFareName;
      });
    });

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


// let result = searchOffersResponseProcessor(data);


module.exports.searchOffersResponseTransform = searchOffersResponseProcessor;
