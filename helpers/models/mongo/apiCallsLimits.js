const {
  mongoose: { Schema },
  getMongoConnection
} = require('../../mongo');
const GliderError = require('../../error');

// Limit Tier schema
const LimitTierSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['lif'],
      required: true
    },
    min: {
      type: String,
      required: true
    },
    max: {
      type: String,
      required: true
    },
    sec: {
      type: Number,
      required: true
    },
    day: {
      type: Number,
      required: true
    }
  }
);

// Limits schema
const ApiCallsLimitsSchema = new Schema(
  {
    api: {
      type: String,
      unique: true,
      required: true
    },
    tiers: {
      type: [LimitTierSchema],
      default: []
    }
  }
);

let connectedModel;

// API calls limits model
const modelResolver = async () => {

  if (connectedModel) {
    return connectedModel;
  }

  const db = await getMongoConnection();
  connectedModel = db.model('ApiCallsLimits', ApiCallsLimitsSchema);

  return connectedModel;
};

class LimitsManager {

  constructor (modelResolver) {
    this.modelResolver = modelResolver;
  }

  // Get the limit
  async get (api, silent = false) {
    let record;

    try {
      const model = await this.modelResolver();
      record = await model
        .findOne({
          api
        })
        .select('-_id -tiers._id -__v');
    } catch (e) {
      throw new GliderError(
        e.message,
        500
      );
    }

    if (!record && !silent) {
      throw new GliderError(
        'Limit not found',
        404
      );
    } else if (!record) {
      record = null;
    }

    return record;
  }

  // Get the limit
  async getAll () {
    let record;

    try {
      const model = await this.modelResolver();
      record = await model
        .find()
        .select('-_id -__v -tiers._id');
    } catch (e) {
      throw new GliderError(
        e.message,
        500
      );
    }

    if (!record) {
      throw new GliderError(
        'Limits not found',
        404
      );
    }

    return record;
  }

  // Add tiers
  async add (api, tiers) {
    const model = await this.modelResolver();
    const record = new model({
      api,
      tiers
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

  async update (api, tiers) {
    let result;

    try {
      const model = await this.modelResolver();
      result = await model.replaceOne(
        {
          api
        },
        {
          api,
          tiers
        }
      );
    } catch (e) {
      throw new GliderError(
        e.message,
        500
      );
    }

    if (result.n === 0) {
      throw new GliderError(
        'Limit not found',
        404
      );
    }
  }

  // Remove the limit
  async remove (api) {
    let result;

    try {
      const model = await this.modelResolver();
      result = await model.remove(
        {
          api
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
        'Limit not found',
        404
      );
    }
  }
}

module.exports = {
  model: modelResolver,
  manager: new LimitsManager(modelResolver)
};
