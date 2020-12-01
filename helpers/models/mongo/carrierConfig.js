const {
  mongoose: { Schema },
  getMongoConnection,
} = require('../../mongo');

const CarrierConfigurationSchema = new Schema(
  {
    carrierCode: {
      type: String,
      required: true,
      unique: true,
    },
    brandedFares: [{
      brandedFareId: {
        type: String,
        required: true,
      },
      brandedFareName: {
        type: String,
        required: true,
      },
      refundable: { type: Boolean, required: true, default: false },
      changeable: { type: Boolean, required: true, default: false },
      penalties: { type: Boolean, required: true, default: false },
      checkedBaggages: {
        quantity: { type: Number, required: true },
      },
      amenities: [String],
    }],
  }, { timestamps: true });

module.exports = async () => {
  const db = await getMongoConnection();
  return db.model('CarrierConfiguration', CarrierConfigurationSchema);
};
