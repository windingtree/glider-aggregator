const template = {
  response: '/SOAP-ENV:Envelope/SOAP-ENV:Body/OTA_HotelResNotifRS/@ResResponseType',
  reservationNumber: '/SOAP-ENV:Envelope/SOAP-ENV:Body/OTA_HotelResNotifRS/HotelReservations/HotelReservation/ResGlobalInfo/HotelReservationIDs/HotelReservationID/@ResID_Value',
  success: '/SOAP-ENV:Envelope/SOAP-ENV:Body/OTA_HotelResNotifRS/Success',
  errors: ['/SOAP-ENV:Envelope/SOAP-ENV:Body/OTA_HotelResNotifRS/Errors/Error', {
    message: '.',
    type: '@Type',
  }],
};

module.exports.otaHotelResNotifRSTemplate = template;
