// const format = require('date-fns/format');
const { getCardCode } = require('./utils/cardUtils');
const { getACSystemId } = require('../soapTemplates/utils/xmlUtils');

module.exports.mapNdcRequestData_AF = (config, { orderItems, passengerReferences }, { orderId }) => ({
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

module.exports.mapNdcRequestHeaderData_AC = guaranteeClaim => ({
  Function: 'OrderChangeRQ',
  SchemaType: 'NDC',
  SchemaVersion: 'YY.2017.2',
  ...(!guaranteeClaim ? {
    RichMedia: true
  } : {}),
  Sender: {
    Address: {
      Company: 'WindingTree',
      NDCSystemId: getACSystemId(guaranteeClaim !== undefined)
    }
  },
  Recipient: {
    Address: {
      Company: 'AC',
      NDCSystemId: getACSystemId(guaranteeClaim !== undefined)
    }
  }
});

module.exports.mapNdcRequestData_AC = (
  config,
  {
    orderId,
    order
  },
  {
    // @todo Inspect these options, if not needed then do refactoring
    orderItems, // eslint-disable-line no-unused-vars
    passengerReferences // eslint-disable-line no-unused-vars
  },
  guaranteeClaim
) => ({
  ...(JSON.parse(JSON.stringify(config))),
  Query: {
    OrderID: orderId,
    ActionContext: 9,
    Payments: {
      Payment: {
        Type: 'CC',
        Method: {
          PaymentCard: {
            CardType: 3,
            CardCode: getCardCode(guaranteeClaim.card, 'iata'),
            CardNumber: guaranteeClaim.card.accountNumber,
            ...(guaranteeClaim.card.cvv ? {
              SeriesCode: guaranteeClaim.card.cvv
            } : {}),
            CardHolderName: 'Simard OU',
            CardHolderBillingAddress: {
              Street: 'Tartu mnt 67',
              BuildingRoom: '1-13b',
              CityName: 'Tallinn',
              StateProv: 'Harju',
              PostalCode: '10115',
              CountryCode: 'EE'
            },
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
