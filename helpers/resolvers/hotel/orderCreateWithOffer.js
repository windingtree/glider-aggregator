/*
  Resolve the order creation from offer of an hotel
  Currently hardcoded to e-revemax
*/
const axios = require('axios');
const { transform } = require('camaro');
const config = require('../../../config');
const responseTemplate = require('../../camaroTemplates/hotelResNotifRS').otaHotelResNotifRSTemplate;

hotelResNotif = require('../../transformInputData/hotelResNotif');
mapOTAHotelResNotifSoap = require('../../soapTemplates/ota/otaHotelResNotifRQ');

module.exports = async (offer, passengers) => {
  return new Promise((resolve, reject) => {
    // Build the request
    const otaHotelResNotifRQData = hotelResNotif.mapFromOffer(offer, passengers);
    const otaRequestBody = mapOTAHotelResNotifSoap(otaHotelResNotifRQData);

    // Send the request
    axios.post(
      config.erevmax.reservationUrl,
      otaRequestBody,
      {
        headers: {
          'Content-Type': 'application/xml',
          SOAPAction: 'http://www.opentravel.org/OTA/2003/05/getOTAHotelAvailability',
        },
      }
    )

    // Handle the response
    .then(response => {
      // Transform the XML answer
      transform(response.data, responseTemplate)

      // Build the answer according to API doc
      .then(responseData => {
        // If any error, send it
        if(responseData.errors.length >0 ) {
          reject({code:502, message: responseData.errors.join(', ')});
        }

        // if no error
        else {
          resolve({order: responseData});
        }
        
      })

      // Handle any error in transforming
      .catch(err => {
        console.log(err);
        reject({code:502, message: 'Error parsing answer from reservation partner'});
      });
    })

    // Handle an error
    .catch(err => {
      console.log(err);
      reject({code:502, message: 'Error connecting with the reservation partner'});
    });
  });
};

