

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
  fulfillOrderTransformTemplate_AC,
  ErrorsTransformTemplate_AC,
  FaultsTransformTemplate_AC
};
