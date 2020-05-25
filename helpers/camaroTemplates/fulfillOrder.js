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

const fulfillOrderTransformTemplate_AC = {
  travelDocuments: {
    bookings: [
      '//OrderViewRS/Response/Order/BookingReferences/BookingReference',
      'ID'
    ],
    etickets: ['//OrderViewRS/Response/TicketDocInfos/TicketDocInfo', {
      _id_: 'TicketDocument/TicketDocNbr',
      _passenger_: 'PassengerReference',
    }],
  },
};

const ErrorsTransformTemplate_AF = {
  errors: ['/S:Envelope/S:Body/ns2:OrderViewRS/ns2:Errors/ns2:Error', {
    message: '@ShortText',
    code: '@Code',
  }]
};

const FaultsTransformTemplate_AC = {
  errors: ['//soap:Fault', {
    message: 'faultstring',
    code: 'faultcode',
    date: 'Timestamp'
  }]
};

const ErrorsTransformTemplate_AC = {
  errors: ['//Errors', {
    message: 'Error',
    code: 'Error/@Code',
    type: 'Error/@Type'
  }]
};

module.exports = {
  fulfillOrderTransformTemplate_AF,
  fulfillOrderTransformTemplate_AC,
  ErrorsTransformTemplate_AF,
  ErrorsTransformTemplate_AC,
  FaultsTransformTemplate_AC
};
