const axios = require('axios');
const { transform } = require('camaro');

const { basicDecorator } = require('../../decorators/basic');
const { getHotelsInRectangle } = require('../parsers/erevmaxHotels');
const { mapRequestData } = require('../transformInputData/hotelAvail');
const { hotelAvailRequestTemplate } = require('../soapTemplates/hotelAvail');
const { hotelAvailTransformTemplate, errorsTransformTemplate } = require('../camaroTemplates/hotelAvail');
const {
  reduceToObjectByKey, reduceObjectToProperty, reduceAcomodation, reduceRoomStays,
} = require('../parsers');

const searchHotel = async (body) => {
  const hotelCodes = getHotelsInRectangle(body.accommodation.location.rectangle);
  if(!hotelCodes.length) throw new Error('Not matching hotels');
 
  const requestData = mapRequestData(hotelCodes, body);
  
  const requestBody = hotelAvailRequestTemplate(requestData);
  const response = await axios.post('https://searchnbook.ratetiger.com/ARIShopService-WS/services/ARIShopService',
  requestBody,
    {
      headers: {
        'Content-Type': 'application/xml',
        SOAPAction: 'http://www.opentravel.org/OTA/2003/05/getOTAHotelAvailability',
      },
    });

  const { errors } = await transform(response.data, errorsTransformTemplate);
  if (errors.length) throw new Error(`${errors[0].message}`);

  const searchResults = await transform(response.data, hotelAvailTransformTemplate);
  

  // Go through the Room Stays to build the offers and gather the room types
  var accomodationRoomTypes = {};
  var offers = {};
  searchResults._roomStays_.forEach(roomStay => {

    // Create the accommodation key
    var accommodationReference = `${roomStay._provider_}.${roomStay._hotelCode_}`;

    // Handle the room types
    for (const roomType of roomStay._roomTypes_) {
      // Reduce the policies
      roomType.policies = reduceToObjectByKey(roomType.policies);
      roomType.policies = reduceObjectToProperty(roomType.policies, '_value_');
      
      // Add the room type to the dict that will be used when building accomodation
      if(!(accomodationRoomTypes[accommodationReference])) {
        accomodationRoomTypes[accommodationReference] = {};
      }      
      accomodationRoomTypes[accommodationReference][roomType._id_] = roomType;
      delete(accomodationRoomTypes[accommodationReference][roomType._id_]._id_);
    }

    // Handle the Rate Plans
    searchResults.pricePlans = reduceToObjectByKey(roomStay._ratePlans_);
    delete(roomStay._ratePlans_);

    // Build the offers by parsing the room rates
    roomStay._roomRates_.forEach(roomRate => {

      // Build the offer key
      var offerKey = `${accommodationReference}.${roomRate.ratePlanReference}.${roomRate.roomTypeReference}`;

      // Build the PricePlanReference
      var pricePlanReference = {
          accommodation: accommodationReference,
          roomType: roomRate.roomTypeReference,
      };
      pricePlansReferences = {};
      pricePlansReferences[roomRate.ratePlanReference] = pricePlanReference;

      // Build the offer
      var offer = {
        // Reference from other elements
        pricePlansReferences: pricePlansReferences,
  
        // Build price
        price: {
          currency: roomRate.price.currency,
          public: roomRate.price._afterTax_,
          taxes: new Number(roomRate.price._afterTax_) - new Number(roomRate.price._beforeTax_),
        },
      };

      // Add the offer to the dict
      offers[offerKey] = offer;
    });
  });

  // Parse the accomodations
  for (var accommodation of searchResults.accommodations) {
    
    // Build the accomodation reference key
    var accommodationReference = `${accommodation._provider_}.${accommodation._id_}`;

    // Reduce the policies
    accommodation.otherPolicies = reduceToObjectByKey(accommodation.otherPolicies);
    accommodation.otherPolicies = reduceObjectToProperty(accommodation.otherPolicies, '_value_');

    // Add the room types gathered from Room Rates
    accommodation.roomTypes = accomodationRoomTypes[accommodationReference];

  }
  searchResults.accommodations = reduceAcomodation(searchResults.accommodations);
  
  searchResults.offers = offers;
  delete(searchResults._roomStays_);

  return searchResults;
};

module.exports = {
  searchHotel,
};