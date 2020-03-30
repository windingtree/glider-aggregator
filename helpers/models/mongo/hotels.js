const {
  mongoose: { Schema, Types },
  getMongoConnection
} = require('../../mongo');
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

let connectedHotelsModel;

// Hotels Data model
const hotelsModelResolver = async () => {

  if (connectedHotelsModel) {
    return connectedHotelsModel;
  }

  const db = await getMongoConnection();
  connectedHotelsModel = db.model('Hotels', HotelsSchema);

  return connectedHotelsModel;
};

// Hotels database manager
class HotelsManager {

  constructor (modelResolver) {
    this.modelResolver = modelResolver;
  }

  // Transform record from the database to the public form
  static mapResult (rec) {
    // Catch the case where no records are returned
    if(!rec) {
      return null;
    }

    // Return the formated result
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

    const model = await this.modelResolver();
    const hotelModel = new model(data);
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
      const model = await this.modelResolver();
      hotel = await model
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

  // Retrieve hotel by Id
  async getById (id) {
    // Get the values
    let res = this.getOne({
      _id: Types.ObjectId(id)
    });

    // If not found, return a 404
    if(!res) {
      throw new GliderError(
        'Hotel not found',
        404
      );
    }

    return res;
  }

  // Search for hotels using matching criteria
  async get (match = {}, skip = 0, limit = null) {
    let hotels;
    let total;

    try {
      const model = await this.modelResolver();
      total = await model.find(match).countDocuments();

      let query = model.find(match);

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
        e.code || 500
      );
    }

    return {
      records: hotels,
      total,
      skip,
      limit
    };
  }

  // Search for hotel by the given location
  searchByLocation (location, skip = 0, limit = null) {
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
      skip,
      limit
    );
  }

  // Search for hotel within the given polygon of coordinates
  searchWithin (polygon, skip = 0, limit = null) {
    console.log('!!!', polygon);
    return this.get(
      {
        location: {
          '$geoWithin': {
            '$polygon': polygon
          }
        }
      },
      skip,
      limit
    );
  }

  // Update existed hotel record by Id
  async updateOne (id, hotel) {
    let result;

    try {
      const model = await this.modelResolver();
      result = await model.replaceOne(
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
      const model = await this.modelResolver();
      result = await model.remove(
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
  model: hotelsModelResolver,
  manager: new HotelsManager(hotelsModelResolver)
};
