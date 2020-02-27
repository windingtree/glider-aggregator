const format = require('date-fns/format');
//const { airFranceConfig } = require('../../config');
const config = require('../../config');


const mapNdcRequestData = ({orderItems, passengers}, { orderId }) => ({
  ...config.airFranceConfig,
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
      PassengerList: passengers,
    }
  },
});

module.exports = {
  mapNdcRequestData,
};
