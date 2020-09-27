const { erevmax } = require('../../../../config');
const { webserviceDefinition } = require('../../../webservice/webserviceClient');
const WebserviceClient = require('../../../webservice/webserviceClient').WebserviceClient;

const WEBSERVICES = {
  HOTEL_AVAILABILITY: 'HOTEL_AVAILABILITY',
  HOTEL_BOOK: 'HOTEL_BOOK',
  HOTEL_CANCEL: 'HOTEL_CANCEL',
};

const WEBSERVICES_CONFIG = [
  webserviceDefinition(WEBSERVICES.HOTEL_AVAILABILITY, erevmax.availabilityUrl),
  webserviceDefinition(WEBSERVICES.HOTEL_BOOK, erevmax.reservationUrl),
  webserviceDefinition(WEBSERVICES.HOTEL_CANCEL, erevmax.cancellationUrl),
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

//cancellation request for eRevmax is the same URL/schema as for booking create but with different params
//but for clarity (and to use simulator) and future change keep it as separate call
const erevmaxHotelBookingCancel = async (request) => {
  return await getWbsClient().wbsRequest(WEBSERVICES.HOTEL_CANCEL, request);
};


module.exports = {
  erevmaxHotelSearch, erevmaxHotelBook, erevmaxHotelBookingCancel,
};
