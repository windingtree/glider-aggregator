const fulfillOrderTransformTemplate_AF = {
  travelDocuments: {
    bookings: [
      '/S:Envelope/S:Body/ns2:OrderViewRS/ns2:Response/ns2:Order/ns2:BookingReferences/ns2:BookingReference',
      'ns2:ID'
    ],
    etickets: [
      '/S:Envelope/S:Body/ns2:OrderViewRS/ns2:Response/ns2:TicketDocInfos/ns2:TicketDocInfo',
      {
        _id_: 'ns2:TicketDocument/ns2:TicketDocNbr',
        _passenger_: 'ns2:PassengerReference',
      }
    ],
  },
};

const ErrorsTransformTemplate_AF = {
  errors: ['/S:Envelope/S:Body/ns2:OrderViewRS/ns2:Errors/ns2:Error', {
    message: '@ShortText',
    code: '@Code',
  }]
};



module.exports = {
  fulfillOrderTransformTemplate_AF,
  ErrorsTransformTemplate_AF,
};
