const { mongoose: { Schema, model } } = require('../../mongo');

const OrdersSchema = new Schema(
  {
    orderId: {
      type: String,
      unique: true
    },
    request: Schema.Types.Mixed,
    guarantee: Schema.Types.Mixed,
    order: Schema.Types.Mixed,
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }
);

module.exports = model('Orders', OrdersSchema);
