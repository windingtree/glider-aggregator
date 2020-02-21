const axios = require('axios');
const { transform } = require('camaro');

const { basicDecorator } = require('../../decorators/basic');
const { getHotelsInRectangle } = require('../parsers/erevmaxHotels');
const { mapRequestData } = require('../transformInputData/hotelAvail');
const { hotelAvailRequestTemplate } = require('../soapTemplates/hotelAvail');
const { hotelAvailTransformTemplate, errorsTransformTemplate } = require('../camaroTemplates/hotelAvail');
const {
  reduceToObjectByKey, reduceObjectToProperty, reduceAcomodation,
} = require('../parsers');

const searchHotel = async (body) => {
  const hotelCodes = getHotelsInRectangle(body.acomodation.location.rectangle);
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
  
  for (const acomodation of searchResults.acomodation) {
    acomodation.otherPolicies = reduceToObjectByKey(acomodation.otherPolicies);
    acomodation.otherPolicies = reduceObjectToProperty(acomodation.otherPolicies, '_value_');
 
    for (const roomType of acomodation.roomTypes) {
      roomType.policies = reduceToObjectByKey(roomType.policies);
      roomType.policies = reduceObjectToProperty(roomType.policies, '_value_');
    }
    acomodation.roomTypes = reduceToObjectByKey(acomodation.roomTypes);
    acomodation.ratePlans = reduceToObjectByKey(acomodation.ratePlans);
  }

  searchResults.acomodation = reduceAcomodation(searchResults.acomodation);
  return searchResults;
};

module.exports = {
  searchHotel,
};