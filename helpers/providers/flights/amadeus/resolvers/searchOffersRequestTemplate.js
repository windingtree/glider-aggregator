const GliderError = require('../../../../error');

const splitIsoDateTime = (isoDateString) => {
  return { 'date': isoDateString.substr(0, 10), 'time': isoDateString.substr(11, 8) };
};

const convertPassengerTypeToAmadeus = (type) => {
  if (type === 'ADT') return 'ADULT';
  else if (type === 'CHD') return 'CHILD';
  else if (type === 'INF') return 'INFANT';
  else throw new GliderError('invalid passenger type:' + type, 400);
};




module.exports.createRequest = (itinerary, passengers) => {
  // const { itinerary, passengers } = body;
  //transform itinerary criteria to Amadeus format
  let itineraryId = 1;
  const originDestinations = itinerary.segments.map(segment => {
    let { date, time } = splitIsoDateTime(segment.departureTime);
    return {
      id: itineraryId++,
      originLocationCode: segment.origin.iataCode,
      destinationLocationCode: segment.destination.iataCode,
      departureDateTimeRange: { date: date, time: time },
    };
  });

  //transform passenger details to too
  let paxId = 1;
  let travelers = [];
  passengers.forEach(passenger=>{
    const { type, count = 1 } = passenger;
    for(let i=0;i<count;i++) {
      travelers.push({
        id: paxId++,
        travelerType: convertPassengerTypeToAmadeus(type)
      });
    }
  });


  let request = {
    // currencyCode: 'USD', //TODO remove hardcoded currency code
    originDestinations: originDestinations,
    travelers:travelers,
    sources: [
      'GDS',
    ],
    searchCriteria: {
      allowAlternativeFareOptions: true,
      maxFlightOffers: 30,
      additionalInformation:{
        chargeableCheckedBags:true,
        brandedFares:true
      },
      pricingOptions:{

      }
    }
  };
  return request;
};

