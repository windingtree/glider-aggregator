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

let a = {
  carrierCode: 'LO',
  brandedFares: [{
    brandedFareId: 'ECOSAVER',
    brandedFareName: 'Economy Saver',
    refundable: true,
    changeable: true,
    penalties: true,
    checkedBaggages: {
      quantity: 10,
    },
    amenities: ['meal on baord', 'extra pillow'],
  }],
};


module.exports = async () => {
  const db = await getMongoConnection();
  return db.model('CarrierConfiguration', CarrierConfigurationSchema);
};
