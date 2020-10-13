const HotelProvider = require('../../hotelProvider');

class HotelProviderRevMaxSimulator extends HotelProvider {
  constructor () {
    super();
  }

  // eslint-disable-next-line no-unused-vars
  async searchByCircle (departure, arrival, locationCircle, guests) {
    return this.returnDummyData();
  }

  // eslint-disable-next-line no-unused-vars
  async searchByPolygon (departure, arrival, locationPolygon, guests) {
    return this.returnDummyData();
  }

  // eslint-disable-next-line no-unused-vars
  async searchByRectangle (departure, arrival, locationRectangle, guests) {
    return this.returnDummyData();
  }

  returnDummyData () {
    console.log('HotelProviderRevMaxSimulator search');
    const erevmaxResponse = require('../../../../test/mocks/erevmax.json');
    const erevmaxErrorsResponse = require('../../../../test/mocks/erevmaxErrors.json');
    let response = process.env.TESTING_PROVIDER_ERRORS === '1' ? erevmaxErrorsResponse : erevmaxResponse;
    return response;
  }

  getProviderID () {
    'EREVMAX-SIMULATOR';
  }
};

module.exports = { HotelProviderRevMaxSimulator };
