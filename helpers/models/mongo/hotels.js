const { mongoose: { Schema, Types, model } } = require('../../mongo');
const GliderError = require('../../error');

// Hotels schema
const HotelsSchema = new Schema(
  {
    provider: {
      type: String,
      required: true
    },
    ref: {
      type: String,
      required: true,
      unique: true
    },
    coordinates: {
      type: [Number], // [<lng>, <lat>]
      index: '2d',
      required: true
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      minlength: 3,
      maxlength: 3
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }
);

// Hotels Data model
const hotelsModel = model('Hotels', HotelsSchema);

// Hotels database manager
class HotelsManager {

  constructor (model) {
    this.model = model;
    this.project = {
      _id: 0,
      id: '$_id',
      provider: '$provider',
      ref: '$ref',
      longitude: { $arrayElemAt: ['$coordinates', 0] },
      latitude: { $arrayElemAt: ['$coordinates', 1] },
      currency: '$currency'
    };
  }

  async addOne (options) {
    const data = options;
    data.coordinates = [options.longitude, options.latitude];
    delete data.latitude;
    delete data.longitude;

    const hotelModel = new this.model(data);
    const validation = hotelModel.validateSync();

    if (validation && validation.errors.length > 0) {
      throw new GliderError(
        validation.errors.map(e => e.message).join('; '),
        405
      );
    }

    let hotel;

    try {
      hotel = await hotelModel.save();
    } catch (e) {
      throw new GliderError(
        e.message,
        500
      );
    }

    return hotel;
  }

  addBulk (hotels = []) {
    return Promise.all(hotels.map(h => this.addOne(h)));
  }

  async getOne (query = {}) {
    let hotels;

    try {
      hotels = await this.model
        .aggregate([
          {
            '$match': query
          }
        ])
        .limit(1)
        .project(this.project)
        .exec();
    } catch (e) {
      throw new GliderError(
        e.message,
        500
      );
    }

    if (hotels.length === 0) {
      throw new GliderError(
        'Hotel not found',
        404
      );
    }

    return hotels[0];
  }

  async getById (id) {
    return this.getOne({
      _id: Types.ObjectId(id)
    });
  }

  async get (match = {}, pagination = {}, sort = null) {
    let hotels;

    try {
      let query = this.model.aggregate(
        [
          {
            '$match': match
          }
        ]
      );

      for (const key in pagination) {
        query = query[key].apply(query, [pagination[key]]);
      }

      if (sort) {
        query = query.sort(sort);
      }

      query = query.project(this.project);

      hotels = await query.exec();
    } catch (e) {
      throw new GliderError(
        e.message,
        500
      );
    }

    return {
      records: hotels,
      pagination,
      sort
    };
  }

  async updateOne (id, hotel) {
    try {
      await this.model.replaceOne(
        {
          _id: id
        },
        hotel
      );
    } catch (e) {
      throw new GliderError(
        e.message,
        500
      );
    }
  }

  async removeOne (id) {
    let result;

    try {
      result = await this.model.remove(
        {
          _id: id
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
        'Hotel not found',
        404
      );
    }
  }
}

module.exports = {
  model: hotelsModel,
  manager: new HotelsManager(hotelsModel)
};
