const GliderError = require('../error');
const OrdersModel = require('./mongo/orders');

class OrdersManager {
  constructor () { }

  saveOrder (orderId, options) {
    return OrdersModel.replaceOne(
      {
        orderId
      },
      {
        orderId,
        request: options.request,
        guarantee: options.request,
        guaranteeClaim: options.request,
        order: options.order
      },
      {
        multi: true,
        upsert: true
      }
    );
  }

  async getOrder (orderId) {
    let order;

    if (!orderId) {
      throw new GliderError(
        'Order Id is required',
        500
      );
    }

    try {
      order = await OrdersModel
        .findOne(
          {
            orderId
          }
        )
        .exec();
    } catch (e) {
      throw new GliderError(
        'Order not found',
        404
      );
    }

    return order;
  }
}

module.exports.ordersManager = new OrdersManager();
