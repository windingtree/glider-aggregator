const GliderError = require('../error');
const ordersModelResolver = require('./mongo/orders');

class OrdersManager {
  constructor () {
  }

  async saveOrder (orderId, options, status) {
    const model = await ordersModelResolver();
    const result = await model.replaceOne(
      {
        orderId,
      },
      {
        orderId,
        orderStatus: status,
        ...options,
      },
      {
        multi: true,
        upsert: true,
      },
    );
    return result;
  }

  async getOrder (orderId) {
    let order;

    if (!orderId) {
      throw new GliderError(
        'Order Id is required',
        405,
      );
    }

    try {
      const model = await ordersModelResolver();
      order = await model
        .findOne(
          {
            orderId,
          },
        )
        .exec();
    } catch (e) {
      throw new GliderError(
        'Order not found',
        404,
      );
    }

    if (!order) {
      throw new GliderError(
        'Order not found',
        404,
      );
    }

    return order;
  }

  async updateOrderStatus (orderId, status) {
    const model = await ordersModelResolver();
    const result = await model.updateOne(
      {
        orderId,
      },
      {
        orderStatus: status,
      },
      {
        upsert: false,
      },
    );
    return result;
  }
}

module.exports.ordersManager = new OrdersManager();
