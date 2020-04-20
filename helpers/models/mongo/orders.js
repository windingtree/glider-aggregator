const {
  mongoose: { Schema },
  getMongoConnection
} = require('../../mongo');

const OrdersSchema = new Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true
    },
    provider: {
      type: String,
      required: true
    },
    request: Schema.Types.Mixed,
    guarantee: Schema.Types.Mixed,
    guaranteeClaim: Schema.Types.Mixed,
    order: Schema.Types.Mixed,
    offer: Schema.Types.Mixed,
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }
);

module.exports = async () => {
  const db = await getMongoConnection();
  return db.model('Orders', OrdersSchema);
};
