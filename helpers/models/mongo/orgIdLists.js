const {
  mongoose: { Schema },
  getMongoConnection
} = require('../../mongo');
const GliderError = require('../../error');

// OrgId List schema
const OrgIdListSchema = new Schema(
  {
    type: {
      type: String,
      enum: [
        'white',
        'black'
      ],
      lowercase: true,
      required: true
    },
    orgId: {
      type: String,
      match: /^0x[a-fA-F0-9]{64}$/,
      required: true
    }
  }
);

// Create unique index to prevent Ids dups
OrgIdListSchema.index(
  {
    type: 1,
    orgId: 1
  },
  {
    unique: true
  }
);

let connectedModel;

// ORG.ID list model
const modelResolver = async () => {

  if (connectedModel) {
    return connectedModel;
  }

  const db = await getMongoConnection();
  connectedModel = db.model('OrgIdList', OrgIdListSchema);

  return connectedModel;
};

class OrgIdListManager {

  constructor (modelResolver) {
    this.modelResolver = modelResolver;
  }

  // Check is OrgId is included into list
  async includes (type, orgId) {
    let record;

    try {
      const model = await this.modelResolver();
      record = await model
        .findOne({
          type,
          orgId
        });
    } catch (e) {
      throw new GliderError(
        e.message,
        500
      );
    }

    return !!record;
  }

  // Get the list
  async get (type) {
    let records;

    try {
      const model = await this.modelResolver();
      records = await model
        .find({
          type
        })
        .map(r => r.map(o => o.orgId));
    } catch (e) {
      throw new GliderError(
        e.message,
        500
      );
    }

    if (!records || records.length === 0) {
      throw new GliderError(
        'List not found',
        404
      );
    }

    return records;
  }

  // Add one orgId to the list
  async addOne (type, orgId) {
    const model = await this.modelResolver();
    const record = new model({
      type,
      orgId
    });
    const validation = record.validateSync();

    if (validation && validation.errors.length > 0) {
      throw new GliderError(
        validation.errors.map(e => e.message).join('; '),
        405
      );
    }

    let savedRecord;

    try {
      savedRecord = await record.save();
    } catch (e) {
      throw new GliderError(
        e.message,
        500
      );
    }

    return savedRecord;
  }

  // Add multiple records
  addBulk (type, orgIds = []) {
    return Promise.all(orgIds.map(o => this.addOne(type, o)));
  }

  // Remove one record from the list
  async removeOne (type, orgId) {
    let result;

    try {
      const model = await this.modelResolver();
      result = await model.remove(
        {
          type,
          orgId
        }
      );
    } catch (e) {
      throw new GliderError(
        e.message,
        500
      );
    }

    if (result.n === 0 || result.deletedCount === 0) {
      throw new GliderError(
        'OrgId not found',
        404
      );
    }
  }

  // Remove multiple records
  removeBulk (type, orgIds = []) {
    return Promise.all(orgIds.map(o => this.removeOne(type, o)));
  }
}

module.exports = {
  model: modelResolver,
  manager: new OrgIdListManager(modelResolver)
};
