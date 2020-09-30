const { reduceToObjectByKey } = require('../../../../parsers');
const { format, parseISO } = require('date-fns');

//request

// eslint-disable-next-line no-unused-vars
const createSearchRequest = (location, departure, arrival, guests) => {
  //TODO remove hardcoded radius
  let request = {
    latitude: location.lat, longitude: location.long, radius: 30, radiusUnit: 'KM',
    currency: 'EUR',
    bestRateOnly: false,
    lang: 'EN',
    checkInDate: format(parseISO(arrival), 'yyyy-MM-dd'),
    checkOutDate: format(parseISO(departure), 'yyyy-MM-dd'),
  };
  return request;
};



//response

const processSearchResponse = (response) => {
  const accommodations = {};
  const pricePlans = {};
  const offers = {};
  response.result && response.result.data.forEach(hotelOffer => {
    try {
      let singleHotelResponse = convertHotelOffers(hotelOffer);
      Object.assign(accommodations, singleHotelResponse.accommodations);
      Object.assign(offers, singleHotelResponse.offers);
      Object.assign(pricePlans, singleHotelResponse.pricePlans);
    } catch (err) {
      let hotelname = hotelOffer && hotelOffer.hotel ? hotelOffer.hotel.name : '??';
      console.warn(`Exception while processing hotel ${hotelname}`, err);
    }
  });
  let result = {
    accommodations: accommodations,
    pricePlans: pricePlans,
    offers: offers,
  };
  return result;
};
const convertHotelOffers = (hotelOffer) => {
  const { hotel: _hotel, offers: _offers } = hotelOffer;
  let basicHotelInfo = getBasicHotelInformation(_hotel);
  let additionalInfo = {
    contactInformation: getHotelContactInfo(_hotel),
    location: getHotelLocation(_hotel),
    checkinoutPolicy: {
      checkinTime: '',
      checkoutTime: '',
    },
    otherPolicies: [],
    media: getHotelMediaList(_hotel),
    roomTypes: [],
  };
  let accommodation = Object.assign(basicHotelInfo, additionalInfo);

  let priceOffers = [];
  let pricePlans = [];
  let roomTypes = [];
  _offers.forEach(_offer => {
    priceOffers.push(createPriceOffer(_hotel.hotelId, _offer));
    pricePlans.push(createPricePlan(_offer));
    roomTypes.push(extractRoomType(_offer));
  });
  accommodation.roomTypes = reduceToObjectByKey(roomTypes);
  let result = {
    accommodations: reduceToObjectByKey([accommodation]),
    pricePlans: reduceToObjectByKey(pricePlans),
    offers: reduceToObjectByKey(priceOffers),
  };
  return result;
};

class Location {
  constructor (latitude, longitude) {
    this._latitude = latitude;
    this._longitude = longitude;
  }

  toJSON () {
    return {
      coordinates: {
        latitude: this._latitude,
        longitude: this._longitude,
      },
    };
  }
}

const getHotelLocation = (hotel) => {
  let res = new Location(hotel.latitude, hotel.longitude);
  return res;
  /*return {
    coordinates: {
      latitude: hotel.latitude,
      longitude: hotel.longitude,
    },
  };*/

};
const getBasicHotelInformation = (hotel) => {

  return {
    _id_: hotel.hotelId,
    name: hotel.name,
    type: 'hotel',
    description: hotel.description ? hotel.description.text : '',
    rating: hotel.rating,
  };
};

class ContactInformation {
  constructor (phoneNumbers, emails, streetAddress, premise, locality, postalCode, country) {
    this._phoneNumbers = phoneNumbers;
    this._emails = emails;
    this._streetAddress = streetAddress;
    this._premise = premise;
    this._locality = locality;
    this._postalCode = postalCode;
    this._country = country;
  }

  toJSON () {
    return {
      phoneNumbers: this._phoneNumbers ? [this._phoneNumbers] : [],
      emails: this._emails ? [this._emails] : [],
      address: {
        streetAddress: this._streetAddress,
        premise: this._premise,
        locality: this._locality,
        postalCode: this._postalCode,
        country: this._country,
      },
    };
  }
}

const getHotelContactInfo = (hotel) => {
  const { address, contact } = hotel;
  const { phone, email } = contact || {};
  const { cityName, postalCode, countryCode, lines } = address;
  let result = new ContactInformation(phone, email, lines.join(','), undefined, cityName, postalCode, countryCode);
  return result;
  // return {
  //   phoneNumbers: [
  //     contact.phone,
  //   ],
  //   emails: [
  //     contact.email,
  //   ],
  //   address: {
  //     streetAddress: address.lines.join(','),
  //     premise: 'MISSING',
  //     locality: address.cityName,
  //     postalCode: address.postalCode,
  //     country: address.countryCode,
  //   },
  // };
};

const getHotelMediaList = (hotel) => {
  const { media } = hotel;

  return media && media.map(record => {
    return {
      'type': 'MISSING',
      'width': 'MISSING',
      'height': 'MISSING',
      'url': record.uri,
    };
  });
};

/*const processOffer = (hotelId, offer) => {
  let pricePlan = createPricePlan(offer);
  let roomType = extractRoomType(offer);
  let priceOffer = createPriceOffer(hotelId, offer);
  // offers.map(offer => extractRoomType(offer));
  return { pricePlan, roomType, priceOffer };
};*/

const ROOM_CATEGORY_MAPPING = {
  STANDARD_ROOM: 'Standard room',
  FAMILY_ROOM: 'Family room',
  DELUXE_ROOM: 'Deluxe room',
  COMFORT_ROOM: 'Comfort room',
  SUPERIOR_ROOM: 'Superior room',
  ACCESSIBLE_ROOM: 'Accessible room',
};

const BEDTYPE_MAPPING = {
  SINGLE: 'single bed',
  DOUBLE: 'double bed',
  KING: 'king-size bed',
  QUEEN: 'queen-size bed',
  TWIN: 'twin bed',
};
const createRoomName = (room) => {
  const { typeEstimated } = room;
  const { category, beds, bedType } = typeEstimated;
  const components = [];
  if (category && ROOM_CATEGORY_MAPPING[category])
    components.push(ROOM_CATEGORY_MAPPING[category]);
  if (beds) {
    let numberOfBeds = parseInt(beds);
    let text = '';
    if (numberOfBeds > 0)
      text = numberOfBeds + ' x ';
    let typeOfBed = bedType && BEDTYPE_MAPPING[bedType] ? BEDTYPE_MAPPING[bedType] : undefined;
    if (typeOfBed)
      components.push(text + typeOfBed);
  }
  return components.join(', ');
};

const extractRoomType = (offer) => {
  const { room, guests, id } = offer;
  const { description } = room;
  return {
    _id_: id,
    'name': createRoomName(room),
    'description': description.text,
    'amenities': [],
    // 'size': {
    //   'value': 'MISSING',
    //   '_unit_': 'MISSING',
    // },
    'maximumOccupancy': {
      'adults': guests.adults,
      // 'childs': '????',
    },
    'media': [],
    'policies': {},
  };
};

const createPricePlan = (offer) => {
  const { id } = offer;
  return {
    _id_: id,
    'name': createPricePlanName(offer),
    'penalties': [],
  };
};
const createPricePlanName = (offer) => {
  let name = '';
  try {
    name = offer.description ? offer.description.text.split('\n')[0] : undefined;
  } catch (err) {
    console.log(123);
  }
  if (!name) {
    let { rateCode } = offer;
    if (rateCode && RATE_TYPES[rateCode])
      name = RATE_TYPES[rateCode];
  }
  if (!name) {
    let { room: { typeEstimated } } = offer;
    if (typeEstimated && typeEstimated.category)
      name = typeEstimated.category;
  }
  return name;
};

const createPriceOffer = (hotelId, offer) => {
  const { id, price } = offer;
  const { currency, total } = price;
  return {
    _id_: id,
    pricePlansReferences: {
      id: {
        accommodation: hotelId,
        roomType: id,
      },
    },
    price: {
      currency: currency,
      public: total,
      taxes: 0,
    },
  };
};

const RATE_TYPES = {
  CON: 'Convention Rates',
  COR: 'Corporate Rates',
  FAM: 'Family Rates',
  GOV: 'Government Rates',
  MIL: 'Military Rates',
  PKG: 'Package Rates',
  PRO: 'Promotional Rates',
  RAC: 'Standard RAC Rates',
  SRS: 'Senior Citizen Rates',
  STP: 'Stopover Rates',
  TUR: 'Tour Rates',
  TVL: 'Travel Industry Rates',
  WKD: 'Weekend Rates',
};
/*
const BED_TYPE_CODES = {
  T: 'Twin',
  S: 'Single',
  D: 'Double',
  K: 'King',
  Q: 'Queen',
  W: 'Water',
  P: 'Pull-out',
};
const ROOM_TYPE_CODES = {
  A: { level: 'Superior', description: 'Room with bath' },
  B: { level: 'Moderate', description: 'Room with bath' },
  C: { level: 'Standard', description: 'Room with bath' },
  D: { level: 'Minimum', description: 'Room with bath' },
  E: { level: 'Superior', description: 'Room with shower' },
  F: { level: 'Moderate', description: 'Room with shower' },
  G: { level: 'Standard', description: 'Room with shower' },
  H: { level: 'Minimum', description: 'Room with shower' },
  I: { level: 'Superior', description: 'Room without bath/shower' },
  J: { level: 'Moderate', description: 'Room without bath/shower' },
  K: { level: 'Minimum', description: 'Room without bath/shower' },
  N: { level: 'N/A', description: 'Non-smoking' },
  P: { level: 'N/A', description: 'Executive suite' },
  S: { level: 'N/A', description: 'Suite' },
  U: { level: 'N/A', description: 'Suite' },
  W: { level: 'N/A', description: 'Room at weekend rate' },
};

*/

module.exports = {
  processSearchResponse, createSearchRequest
};
