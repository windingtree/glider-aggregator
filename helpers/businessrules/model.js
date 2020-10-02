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
  const githubBranch = process.env.VERCEL_GITHUB_COMMIT_REF || process.env.NOW_GITHUB_COMMIT_REF || 'undefined';
  const environment = (githubBranch === 'master' ? 'production' : 'staging');
  const key = `${environment.toUpperCase()}_BUSINESS_RULES_MONGO_URL`;
  const breRulesMongoUrl = process.env[key];
  console.log(`Using the following BRE Rules mongo env variable:${key}`);
  const conn = await mongoose.createConnection(breRulesMongoUrl, { useNewUrlParser: true });
  const BREModel = conn.model('business-rules', BRESchema);
  let records = await BREModel.find({ topic: topic });
  await conn.close();
  console.log(`Loaded ${records.length} business rules for topic:${topic}`);
  return records;
};

module.exports = { loadBreRules };
