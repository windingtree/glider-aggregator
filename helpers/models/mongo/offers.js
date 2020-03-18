const config = require('../../../config');
const { mongoose: { Schema, model } } = require('../../mongo');
// const { parseKeys } = require('../../parsers/responseKeys');

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

module.exports = model('Offers', OffersSchema);
