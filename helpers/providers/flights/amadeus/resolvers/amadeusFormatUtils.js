const GliderError = require('../../../../error');


const createSegment = (segment) => {
  const { id, carrierCode: marketingCarrier, operating, number: flightNumber, departure, arrival } = segment;
  const { iataCode: originIataCode, at: departureTime } = departure;
  const { iataCode: destinationIataCode, at: arrivalTime } = arrival;
  const operatingCarrier = operating ? operating.carrierCode : marketingCarrier;
  return {
    _id_: id,
    operator: {
      operatorType: 'airline',
      iataCode: operatingCarrier,
      iataCodeM: marketingCarrier,
      flightNumber: flightNumber,
    },
    origin: {
      locationType: 'airport',
      iataCode: originIataCode,
    },
    destination: {
      locationType: 'airport',
      iataCode: destinationIataCode,
    },
    departureTime: departureTime,
    arrivalTime: arrivalTime,
    Departure: {
      AirportCode: originIataCode,
      // Date: 2020-09-13,
      // Time: 10:15,
      // Terminal: {
      //   Name:
      // }
    },
    Arrival: {
      AirportCode: destinationIataCode,
      // Date: 2020-09-13,
      // Time: 12:05,
      // Terminal: {
      //   Name:
      // }
    },
  };
};
const createPrice = (price, commission = 0) => {
  const { grandTotal, currency } = price;
  //TODO calculate commission
  //calculate offer price
  let tax = price.fees.reduce((total, taxItem) => {
    return total + Number(taxItem.amount);
  }, 0);

  return {
    currency: currency,
    public: grandTotal,
    commission: commission,
    taxes: Number(tax).toFixed(2),
  };
};
const convertGenderFromAmadeusToGlider = (gender) => {
  if (gender === 'MALE') return 'Male';
  else if (gender === 'FEMALE') return 'Female';
  else throw new GliderError('invalid gender:' + gender, 400);
  // else return undefined;
};
const convertGenderFromGliderToAmadeus = (gender) => {
  if (gender === 'MR') return 'MALE';
  else if (gender === 'MRS') return 'FEMALE';
  else throw new GliderError('invalid gender:' + gender, 400);
  // else return undefined;
};
const convertPassengerTypeFromAmadeusToGlider = (type) => {
  if (type === 'ADULT') return 'ADT';
  else if (type === 'CHILD') return 'CHD';
  else if (type === 'INFANT') return 'INF';
  else throw new GliderError('invalid passenger type:' + type, 400);
};
const convertPassengerTypeFromGliderToAmadeus = (type) => {
  if (type === 'ADT') return 'ADULT';
  else if (type === 'CHD') return 'CHILD';
  else if (type === 'INF') return 'INFANT';
  else throw new GliderError('invalid passenger type:' + type, 400);
};
const createPassenger = (travelerPricing) => {
  const { travelerId, travelerType } = travelerPricing;
  return {
    _id_: travelerId,
    type: convertPassengerTypeFromAmadeusToGlider(travelerType),
  };
};


module.exports = {
  createSegment: createSegment,
  createPrice: createPrice,
  convertPassengerTypeToGliderType: convertPassengerTypeFromAmadeusToGlider,
  convertPassengerTypeFromGliderToAmadeus: convertPassengerTypeFromGliderToAmadeus,
  convertGenderFromAmadeusToGlider: convertGenderFromAmadeusToGlider,
  convertGenderFromGliderToAmadeus: convertGenderFromGliderToAmadeus,
  createPassenger: createPassenger,
};
