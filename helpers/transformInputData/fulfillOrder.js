const format = require('date-fns/format');
const { airFranceConfig } = require('../../config');

const mapNdcRequestData = ({orderItems, passengers}, { orderId }) => ({
  ...airFranceConfig,
  requestTime: (new Date(Date.now())).toISOString(),
  Query: {
    TicketDocInfo: {
      OrderReference: {
        OrderID: {
          id: orderId,
          Owner: airFranceConfig.AirlineID
        },
        OrderItemIDs: orderItems,
      },
    },
    DataLists: {
      PassengerList: passengers,
    }
  },
});

module.exports = {
  mapNdcRequestData,
};
