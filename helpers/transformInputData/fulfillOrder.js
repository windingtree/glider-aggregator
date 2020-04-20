const format = require('date-fns/format');
const { getCardCode } = require('./utils/cardUtils');

const mapNdcRequestData_AF = (config, { orderItems, passengerReferences }, { orderId }) => ({
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

const mapNdcRequestData_AC = (
  config,
  {
    orderId,
    order
  },
  {
    orderItems,
    passengerReferences
  },
  guaranteeClaim
  ) => ({
  ...(JSON.parse(JSON.stringify(config))),
  Query: {
    OrderID: orderId,
    ActionContext: 9,
    Payments: {
      Payment: {
        Type: 'MS',
        Method: {
          PaymentCard: {
            CardType: 1,
            CardCode: getCardCode(guaranteeClaim.card),
            CardNumber: guaranteeClaim.card.accountNumber,
            ...(guaranteeClaim.card.cvv ? {
              SeriesCode: guaranteeClaim.card.cvv
            } : {}),
            EffectiveExpireDate: {
              Expiration: `${guaranteeClaim.card.expiryMonth}${guaranteeClaim.card.expiryYear.substr(-2)}`
            }
          }
        },
        Amount: {
          '@Code': order.order.price.currency,
          '@value': order.order.price.public
        }
      }
    }
  },
});

module.exports = {
  mapNdcRequestData_AF,
  mapNdcRequestData_AC
};
