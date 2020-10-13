// const format = require('date-fns/format');

/* istanbul ignore next */
module.exports.mapNdcRequestData_AF = (config, { orderItems, passengerReferences }, orderId) => ({
  ...(JSON.parse(JSON.stringify(config))),
  requestTime: (new Date(Date.now())).toISOString(),
  Query: {
    TicketDocInfo: {
      OrderReference: {
        OrderID: {
          id: orderId,
          Owner: config.airFranceConfig.AirlineID
        },
        OrderItemIDs: orderItems,
      },
    },
    DataLists: {
      PassengerList: passengerReferences,
    }
  },
});
