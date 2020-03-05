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

    //console.log(otaRequestBody);
    axios({
      method: 'post',
      url: config.erevmax.reservationUrl,
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
        'SOAPAction': 'http://www.opentravel.org/OTA/2003/05/getOTAHotelAvailability',
      },
      data: otaRequestBody,
      //responseType: 'stream'
    })

    // Handle the response
    .then(response => {

      // Transform the XML answer
      transform(response.data, responseTemplate)

      // Build the answer according to API doc
      .then(responseData => {
        console.log(responseData);
        // If any error, send it
        if(responseData.errors.length >0 ) {
          const errors = responseData.errors.map(({type, message}) => `[${type}] ${message}`);
          reject({code:502, message: errors.join(' ,')});
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

