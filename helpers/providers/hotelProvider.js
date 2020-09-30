const GliderError = require('../error');
module.exports = class HotelProvider {
  constructor () {
  }

  async search (context, accommodation, guests) {
    const { location, departure, arrival } = accommodation;
    const { circle, polygon, rectangle } = location;
    let results;
    if (circle) {
      results = await this.searchByCircle(context, departure, arrival, circle, guests);
    } else if (polygon) {
      results = await this.searchByPolygon(context, departure, arrival, polygon, guests);
    } else if (rectangle) {
      results = await this.searchByRectangle(context, departure, arrival, rectangle, guests);
    } else {
      throw new GliderError('A location area of type rectangle, circle or polygon is required', 400);
    }
    return results;
  }

  // eslint-disable-next-line no-unused-vars
  async searchByCircle (context, departure, arrival, locationCircle, guests) {
    throw new Error('This method must be implemented in subclass');
  }

  // eslint-disable-next-line no-unused-vars
  async searchByPolygon (context, departure, arrival, locationPolygon, guests) {
    throw new Error('This method must be implemented in subclass');
  }

  // eslint-disable-next-line no-unused-vars
  async searchByRectangle (context, departure, arrival, locationRectange, guests) {
    throw new Error('This method must be implemented in subclass');
  }

  getProviderID () {
    throw new Error('This method must be implemented in subclass');
  }

  // eslint-disable-next-line no-unused-vars
  async createOrder (offer, passengers, card) {
    throw new Error('This method must be implemented in subclass');
  }

  // eslint-disable-next-line no-unused-vars
  async cancelOrder (order, offer, passengers, card) {
    throw new Error('This method must be implemented in subclass');
  }
};
