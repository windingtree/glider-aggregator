/*
  Resolve the order creation from offer of an hotel
  Currently hardcoded to e-revemax
*/
const axios = require('axios');
const { transform } = require('camaro');
const config = require('../../../config');
const GliderError = require('../../error');
const responseTemplate = require('../../camaroTemplates/hotelResNotifRS').otaHotelResNotifRSTemplate;

const hotelResNotif = require('../../transformInputData/hotelResNotif');
const mapOTAHotelResNotifSoap = require('../../soapTemplates/ota/otaHotelResNotifRQ');
const { v4: uuidv4 } = require('uuid');

module.exports = async (offer, passengers, card) => {
  // Build the request
  const otaHotelResNotifRQData = hotelResNotif.mapFromOffer(offer, passengers, card);
  const otaRequestBody = mapOTAHotelResNotifSoap(otaHotelResNotifRQData);

  const response = await axios({
    method: 'post',
    url: config.erevmax.reservationUrl,
    headers: {
      'Content-Type': 'text/xml;charset=UTF-8',
      'Accept': '*/*',
      'Accept-Encoding': 'gzip, deflate, br',
      'SOAPAction': 'http://www.opentravel.org/OTA/2003/05/getOTAHotelAvailability',
    },
    data: otaRequestBody
  });

  // Transform the XML answer
  const responseData = await transform(response.data, responseTemplate);

  // If any error, send it
  if(responseData.errors.length > 0) {
    throw new GliderError(
      responseData.errors.map(e => e.message).join('; '),
      502
    );
  }

  return {
    orderId: uuidv4(),
    order: {
      ...responseData,
      passengers
    }
  };
};
