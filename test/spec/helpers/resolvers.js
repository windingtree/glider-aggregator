const { assertFailure } = require('../../helpers/assertions');
const {
  searchHotel
} = require('../../../helpers/resolvers/searchHotel');
require('chai').should();

describe('Helpers/resolvers', () => {

  describe('#searchHotel', () => {
    const rectangleRequest = {
      accommodation: {
        location: {
          rectangle: {
            north: '59',
            south: '57',
            west: '11',
            east: '20'
          }
        },
        arrival: '2020-09-02T00:00:00Z',
        departure: '2020-09-03T00:00:00Z'
      },
      passengers: [
        {
          type: 'ADT',
          count: 2
        },
        {
          type: 'CHD',
          count: 1
        }
      ]
    };

    it('should fail if passengers has not been provided in request', async () => {
      await assertFailure(
        searchHotel(Object.assign({}, rectangleRequest, { passengers: undefined })),
        'Missing passenger types',
        400
      );
    });

    it('should fail if unknown location area type has been provided', async () => {
      await assertFailure(
        searchHotel(Object.assign({}, rectangleRequest, { accommodation: {
          location: {
            'unknownType': []
          }
        } })),
        'A location area of type rectangle, circle or polygon is required',
        400
      );
    });

    describe('Tests with empty result', () => {
      before(async () => {
        process.env.TESTING_EMPTY_RESULT = '1';
      });
      after(async () => {
        process.env.TESTING_EMPTY_RESULT = '0';
      });

      it('should fail if no hotels found', async () => {
        await assertFailure(
          searchHotel(rectangleRequest),
          'No Hotels were found with the provided criteria',
          404
        );
      });
    });

    describe('Tests with erevmax errors', () => {
      before(async () => {
        process.env.TESTING_PROVIDER_ERRORS = '1';
      });
      after(async () => {
        process.env.TESTING_PROVIDER_ERRORS = '0';
      });

      it('should fail if errors gets with erevmax response', async () => {
        await assertFailure(
          searchHotel(rectangleRequest),
          'Request Could Not Be Processed At This Moment',
          502
        );
      });
    });

    it('should resolve hotels by rectangle request', async () => {
      const result = await searchHotel(rectangleRequest);
      (result).should.be.an('object').to.have.property('accommodations').to.be.an('object');
      (result).should.to.have.property('pricePlans').to.be.an('object');
      (result).should.to.have.property('offers').to.be.an('object');
      (result).should.to.have.property('passengers').to.be.an('object');
    });
  });
});
