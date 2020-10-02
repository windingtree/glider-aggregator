const mongoose = require('mongoose');
const config = require('../../config');

const BRESchema = mongoose.Schema({
  topic: { type: String, required: true },
  conditions: { type: mongoose.Mixed, required: true },
  priority: { type: Number },
  event: { type: mongoose.Mixed, required: true },
  comment: { type: String },
}, { collection: 'b2b' });



const loadBreRules = async (topic) => {
  const conn = await mongoose.createConnection(config.BUSINESS_RULES_MONGO_URL, { useNewUrlParser: true });
  const BREModel = conn.model('business-rules', BRESchema);
  let records = await BREModel.find({ topic: topic });
  await conn.close();
  console.log(`Loaded ${records.length} business rules for topic:${topic}`);
  return records;
};

module.exports = { loadBreRules };
