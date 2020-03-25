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
    location: {
      type: [Number], // [<lng>, <lat>]
      required: true,
      index: {
        type: '2dsphere',
        sparse: true
      }
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
  }

  // Transform record from the database to the public form
  static mapResult (rec) {
    return {
      id: rec._id,
      provider: rec.provider,
      ref: rec.ref,
      longitude: rec.location[0],
      latitude: rec.location[1],
      currency: rec.currency
    };
  }

  // Add new hotel
  async addOne (options) {
    const data = options;
    data.location = [options.longitude, options.latitude];
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

  // Add multiple hotels
  addBulk (hotels = []) {
    return Promise.all(hotels.map(h => this.addOne(h)));
  }

  // Retrive hotel record by the given criteria
  async getOne (match = {}) {
    let hotel;

    try {
      hotel = await this.model
        .findOne(match)
        .map(HotelsManager.mapResult);
    } catch (e) {
      throw new GliderError(
        e.message,
        500
      );
    }

    if (!hotel) {
      throw new GliderError(
        'Hotel not found',
        404
      );
    }

    return hotel;
  }

  // Retrive hotel by Id
  async getById (id) {
    return this.getOne({
      _id: Types.ObjectId(id)
    });
  }

  // Search for hotels using matching criteria
  async get (match = {}, sort = null, skip = 0, limit = null) {
    let hotels;
    let total;

    try {
      total = await this.model.find(match).countDocuments();

      let query = this.model.find(match);

      if (sort) {
        query = query.sort(sort);
      }

      if (skip) {
        query = query.skip(skip);
      }

      if (limit) {
        query = query.limit(limit);
      }

      hotels = await query
        .map(result => result.map(HotelsManager.mapResult))
        .exec();
    } catch (e) {
      throw new GliderError(
        e.message,
        500
      );
    }

    return {
      records: hotels,
      total,
      sort,
      skip,
      limit
    };
  }

  // Search for hotel by the given location
  searchByLocation (location, sort = null, skip = 0, limit = null) {
    return this.get(
      {
        location: {
          '$geoWithin': {
            '$centerSphere': [
              [
                location.longitude,
                location.latitude
              ],
              Number(location.radius) / 3963.2
            ]
          }
        }
      },
      sort,
      skip,
      limit
    );
  }

  // Search for hotel within the given polygon of coordinates
  searchWithin (polygon, sort = null, skip = 0, limit = null) {
    return this.get(
      {
        location: {
          '$geoWithin': {
            '$polygon': polygon
          }
        }
      },
      sort,
      skip,
      limit
    );
  }

  // Update existed hotel record by Id
  async updateOne (id, hotel) {
    let result;

    try {
      result = await this.model.replaceOne(
        {
          _id: id
        },
        {
          provider: hotel.provider,
          ref: hotel.ref,
          location: [
            hotel.longitude,
            hotel.latitude
          ],
          currency: hotel.currency
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
        'Hotel not found',
        404
      );
    }
  }

  // Remove existed hotel record by Id
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
