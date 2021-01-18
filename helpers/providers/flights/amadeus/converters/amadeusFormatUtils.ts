import { Gender, LocationType, OperatorType, PassengerType, PriceWithTax, Segment } from './types';
 
const GliderError = require('../../../../error');

const createSegment = (segment:any):Segment => {
  const { id, carrierCode: marketingCarrier, operating, number: flightNumber, departure, arrival } = segment;
  const { iataCode: originIataCode, at: departureTime } = departure;
  const { iataCode: destinationIataCode, at: arrivalTime } = arrival;
  const operatingCarrier = operating ? operating.carrierCode : marketingCarrier;
  return {
    _id_: id,
    operator: {
      operatorType: OperatorType.airline,
      iataCode: operatingCarrier,
      iataCodeM: marketingCarrier,
      flightNumber: flightNumber,
    },
    origin: {
      locationType: LocationType.airport,
      iataCode: originIataCode,
    },
    destination: {
      locationType: LocationType.airport,
      iataCode: destinationIataCode,
    },
    departureTime: departureTime,
    arrivalTime: arrivalTime
  };
};

const createPrice = (price:any, commission = 0):PriceWithTax => {
  const { grandTotal, currency } = price;
  //TODO calculate commission
  //calculate offer price
  let tax = 0;
  if(price && price.fees)
  {
    tax=price.fees.reduce((total:number, taxItem:any) => {
      return total + Number(taxItem.amount);
    }, 0);
  }

  return {
    currency: currency,
    public: grandTotal,
    commission: commission,
    taxes: Number(tax),
  };
};


const convertGenderFromAmadeusToGlider = (gender:Gender):string => {
  if (gender === Gender.male) return 'Male';
  else if (gender === Gender.female) return 'Female';
  else throw new GliderError('invalid gender:' + gender, 400);
};
const convertGenderFromGliderToAmadeus = (gender:string):Gender => {
  if (gender === 'MR') return Gender.male;
  else if (gender === 'MRS') return Gender.female;
  else throw new GliderError('invalid gender:' + gender, 400);
};
const convertPassengerTypeFromAmadeusToGlider = (type:string):PassengerType => {
  if (type === 'ADULT') return PassengerType.ADULT;
  else if (type === 'CHILD') return PassengerType.CHILD;
  else if (type === 'HELD_INFANT' || type === 'SEATED_INFANT') return PassengerType.INFANT;
  else throw new GliderError('invalid passenger type:' + type, 400);
};
const convertPassengerTypeFromGliderToAmadeus = (type:PassengerType) => {
  if (type === PassengerType.ADULT) return 'ADULT';
  else if (type === PassengerType.CHILD) return 'CHILD';
  else if (type === PassengerType.INFANT) return 'HELD_INFANT';
  else throw new GliderError('invalid passenger type:' + type, 400);
};
const createPassenger = (travelerPricing:any) => {
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
