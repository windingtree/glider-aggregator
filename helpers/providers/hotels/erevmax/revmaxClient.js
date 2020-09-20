const { erevmax } = require('../../../../config');
const { webserviceDefinition } = require('../../../webservice/webserviceClient');
const WebserviceClient = require('../../../webservice/webserviceClient').WebserviceClient;

const WEBSERVICES = {
  HOTEL_AVAILABILITY: 'HOTEL_AVAILABILITY',
  HOTEL_BOOK: 'HOTEL_BOOK',
};

const WEBSERVICES_CONFIG = [
  webserviceDefinition(WEBSERVICES.HOTEL_AVAILABILITY, erevmax.availabilityUrl),
  webserviceDefinition(WEBSERVICES.HOTEL_BOOK, erevmax.reservationUrl),
];

let wbsClient;

const getWbsClient = () => {
  if (!wbsClient) {
    wbsClient = new WebserviceClient(WEBSERVICES_CONFIG);
  }
  return wbsClient;
};

const erevmaxHotelSearch = async (request) => {
  return await getWbsClient().wbsRequest(WEBSERVICES.HOTEL_AVAILABILITY, request);
};

const erevmaxHotelBook = async (request) => {
  return await getWbsClient().wbsRequest(WEBSERVICES.HOTEL_BOOK, request);
};



module.exports = {
  erevmaxHotelSearch, erevmaxHotelBook,
};
