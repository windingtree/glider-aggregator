/*
  Resolve the order creation from offer of an hotel
  Currently hardcoded to e-revemax
*/
const { createHotelProvider } = require('../../providers/providerFactory');

const { v4: uuidv4 } = require('uuid');

/*

const revMax = async (offer, passengers, card) => {
  // Build the request
  const otaHotelResNotifRQData = hotelResNotif.mapFromOffer(offer, passengers, card);
  const otaRequestBody = mapHotelResNotifSoap(otaHotelResNotifRQData);

  let response;
  /!* istanbul ignore next *!/
  response = await axios({
    method: 'post',
    url: config.erevmax.reservationUrl,
    headers: {
      'Content-Type': 'text/xml;charset=UTF-8',
      'Accept': '*!/!*',
      'Accept-Encoding': 'gzip, deflate, br',
      'SOAPAction': 'http://www.opentravel.org/OTA/2003/05/getOTAHotelAvailability',
    },
    data: otaRequestBody
  });

  if(response.status !== 200 || !response.data) {
    /!* istanbul ignore if *!/
      console.log(JSON.stringify(otaRequestBody));
      response.data && console.log(JSON.stringify(response.data));
    throw new GliderError(
      `[erevmax:${response.status}] Booking creation failed`,
      502
    );
  }


  // Transform the XML answer
  const responseData = await transform(response.data, responseTemplate);
  // If any error, send it
  if(responseData.errors.length > 0) {
    throw new GliderError(
      responseData.errors.map(e => e.message).join('; '),
      502
    );
  }
  return responseData;
};
*/

module.exports = async (offer, passengers, card) => {
  let provider = offer.provider;
  let providerImpl = createHotelProvider(provider);
  // providerImpl.createOrder(offer, passengers, card);
  /*if (!process.env.TESTING) {

  } else {
    response = process.env.TESTING_PROVIDER_ERRORS === '1'
      ? {
        status: 502,
        data: {}
      }
      : require('../../../test/mocks/erevmaxOrder.json');
  }
  // console.log('@@@', require('../../json').stringifyCircular(response));

  */
  let responseData = await providerImpl.createOrder(offer, passengers, card);
  return {
    orderId: uuidv4(),
    order: {
      ...responseData,
      passengers,
    },
  };
};
