const mongoose = require('mongoose');
const config = require('../../config');

const BRESchema = mongoose.Schema({
  topic: { type: String, required: true },
  conditions: { type: mongoose.Mixed, required: true },
  priority: { type: Number },
  event: { type: mongoose.Mixed, required: true },
  comment: { type: String },
}, { collection: 'BRE' });



const loadBreRules = async (topic) => {
  const conn = await mongoose.createConnection(config.mongoUrl, { useNewUrlParser: true });
  const BREModel = conn.model('business-rules', BRESchema);
  let records = await BREModel.find({ topic: topic });
  await conn.close();
  console.log(`Loaded ${records.length} business rules for topic:${topic}`);
  return records;
};

module.exports = { loadBreRules };
