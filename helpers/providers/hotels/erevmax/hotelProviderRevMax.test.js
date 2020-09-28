const { assertFailure } = require('../../../../test/helpers/assertions');
const {
  rectangleToPolygon,
  getGuestCounts
} = require('./hotelProviderRevMax');
const {
  GuestCount
} = require('../../../../helpers/models/offer');

require('chai').should();

describe('providers/hotels/revmax/HotelProviderRevMax', () => {

  describe('#rectangleToPolygon', () => {
    const rectangle = {
      south: '50.0929802',
      west: '14.4012451',
      north: '50.0812615',
      east: '14.4394467'
    };

    it('should throw if wrong rectangle has been provided', async () => {
      (() => rectangleToPolygon([])).should.to.throw;
      (() => rectangleToPolygon(
        Object.assign({}, rectangle, { north: undefined })
      )).should.to.throw;
      (() => rectangleToPolygon(
        Object.assign({}, rectangle, { north: 'NaN' })
      )).should.to.throw;
    });

    it('should convert rectangle coordinates to polygon', async () => {
      const result = rectangleToPolygon(rectangle);
      (result[0][0]).should.equal(Number(rectangle.west));
      (result[0][1]).should.equal(Number(rectangle.north));
      (result[1][0]).should.equal(Number(rectangle.east));
      (result[1][1]).should.equal(Number(rectangle.north));
      (result[2][0]).should.equal(Number(rectangle.east));
      (result[2][1]).should.equal(Number(rectangle.south));
      (result[3][0]).should.equal(Number(rectangle.west));
      (result[3][1]).should.equal(Number(rectangle.south));
    });
  });
  describe('#getGuestCounts', () => {
    const passengers = [
      {
        type: 'ADT',
        count: 2
      },
      {
        type: 'CHD',
        count: 1
      },
    ];

    const validateGuestCounts = gc => {
      (gc).should.to.be.an('array');
      gc.forEach(g => {
        (g).should.be.an.instanceOf(GuestCount);
      });
    };

    it('should fail if passengers not defined or wrong array has been provided', async () => {
      await assertFailure(
        () => getGuestCounts(undefined),
        'Passengers search property is required',
        400
      );
      await assertFailure(
        () => getGuestCounts({}),
        'Passengers search property is required',
        400
      );
      await assertFailure(
        () => getGuestCounts([]),
        'Passengers search property is required',
        400
      );
    });

    it('should throw if passengers property has wrong type', async () => {
      await assertFailure(
        () => getGuestCounts([
          {
            type: 'UNKNOWN',
            count: 2
          }
        ]),
        'Unsupported passenger type',
        400
      );
    });

    it('should fail if at least one adult passenger', async () => {
      await assertFailure(
        () => getGuestCounts([
          {
            type: 'CHD',
            count: 1
          }
        ]),
        'At least one adult passenger is required to search properties',
        400
      );
    });

    it('should return passengers counts', async () => {
      const result = getGuestCounts(passengers);
      (result.length).should.equal(passengers.length);
      validateGuestCounts(result);
    });
  });
});
