const {
  mongoose: { Schema },
  getMongoConnection
} = require('../../mongo');

const OrdersSchema = new Schema(
  {
    orderId: {
      type: String,
      unique: true
    },
    request: Schema.Types.Mixed,
    guarantee: Schema.Types.Mixed,
    guaranteeClaim: Schema.Types.Mixed,
    order: Schema.Types.Mixed,
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
