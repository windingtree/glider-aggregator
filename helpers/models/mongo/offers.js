const config = require('../../../config');
const {
  mongoose: { Schema },
  getMongoConnection
} = require('../../mongo');

const OffersSchema = new Schema(
  {
    offerId: {
      type: String,
      unique: true
    },
    offer: Schema.Types.Mixed,
    updatedAt: {
      type: Date,
      default: Date.now,
      expires: `${config.expirationTime}s`// in seconds
    }
  }
);

module.exports = async () => {
  const db = await getMongoConnection();
  return db.model('Offers', OffersSchema);
};

