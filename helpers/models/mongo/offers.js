const config = require('../../../config');
const { mongoose: { Schema, model } } = require('../../mongo');
// const { parseKeys } = require('../../parsers/responseKeys');

const OffersSchema = new Schema({
  offerId: {
    type: String,
    unique: true
  },
  offer: Schema.Types.Mixed,
  expireAt: { // @todo Verify this feature
    type: Date,
    default: () => config.expirationTime
  }
});

module.exports = model('Offers', OffersSchema);
