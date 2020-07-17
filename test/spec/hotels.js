const { assertFailure } = require('../helpers/assertions');
const regex = require('../helpers/matches');
const {
  rectangleToPolygon,
  getGuestCounts
} = require('../../helpers/resolvers/searchHotel');
const {
  GuestCount
} = require('../../helpers/models/offer');
const {
  mapRequestData
} = require('../../helpers/transformInputData/hotelAvail');

require('chai').should();

const validateGuestCounts = gc => {
  (gc).should.to.be.an('array');
  gc.forEach(g => {
    (g).should.be.an.instanceOf(GuestCount);
  });
};

const validateHotelRef = hr => {
  (hr).should.to.have.property('HotelCode').to.be.a('string');
  (hr).should.to.have.property('StayDateRange').to.be.an('object');
  (hr.StayDateRange).should.to.have.property('Start');
  (hr.StayDateRange).should.to.have.property('Duration');
  (hr.StayDateRange).should.to.have.property('RoomStayCandidates').to.be.an('object');
  (hr.StayDateRange.RoomStayCandidates).should.to.have.property('RoomStayCandidate').to.be.an('object');
  (hr.StayDateRange.RoomStayCandidates.RoomStayCandidate).should.to.have.property('Quantity');
  (hr.StayDateRange.RoomStayCandidates.RoomStayCandidate).should.to.have.property('GuestCounts').to.be.an('array');
  
  hr.StayDateRange.RoomStayCandidates.RoomStayCandidate.GuestCounts.forEach(g => {
    (g).should.be.an('object');
    (g).should.to.have.property('AgeQualifyingCode').to.be.a('number');
    (g).should.to.have.property('Count').to.be.a('number');
  });
};

describe('Hotels', () => {

  describe('Search offers', () => {

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

    describe('#mapRequestData', () => {
      const hotelCodes = [
        '02034',
        '02035',
        '02036'
      ];

      const body = {
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

      it('should throw if wrong hotelCodes property has been provided', async () => {
        (() => mapRequestData(undefined, body)).should.to.throw;
        (() => mapRequestData({}, body)).should.to.throw;
        (() => mapRequestData([], body)).should.to.throw;
      });

      it('should throw if wrong accommodation property has been provided', async () => {
        // undefined accommodation
        (() => mapRequestData(
          hotelCodes,
          Object.assign({}, body, { accommodation: undefined })
        )).should.to.throw;
        // undefined arrival
        (() => mapRequestData(
          hotelCodes,
          Object.assign({}, body, { accommodation: {
            arrival: undefined,
            departure: '2020-09-03T00:00:00Z'
          } })
        )).should.to.throw;
        // empty arrival
        (() => mapRequestData(
          hotelCodes,
          Object.assign({}, body, { accommodation: {
            arrival: '',
            departure: '2020-09-03T00:00:00Z'
          } })
        )).should.to.throw;
      });

      it('should throw if wrong passengers property has been provided', async () => {
        // undefined passengers
        (() => mapRequestData(
          hotelCodes,
          Object.assign({}, body, { passengers: undefined })
        )).should.to.throw;
        // broken passengers
        (() => mapRequestData(
          hotelCodes,
          Object.assign({}, body, { passengers: {} })
        )).should.to.throw;
        // empty passengers
        (() => mapRequestData(
          hotelCodes,
          Object.assign({}, body, { passengers: [] })
        )).should.to.throw;
      });

      it('should map request data', async () => {
        const result = mapRequestData(hotelCodes, body);
        
        (result).should.be.an('object').to.have.property('OTA_HotelAvailRQ').to.be.an('object');
        (result.OTA_HotelAvailRQ).should.to.have.property('TimeStamp').to.match(regex.dateISO);
        (result.OTA_HotelAvailRQ).should.to.have.property('Version').to.match(regex.dotVersioning);
        (result.OTA_HotelAvailRQ).should.to.have.property('PrimaryLangID').to.match(regex.langCode);
        (result.OTA_HotelAvailRQ).should.to.have.property('AvailRatesOnly').to.be.a('boolean');
        (result.OTA_HotelAvailRQ).should.to.have.property('RequestedCurrency').to.match(regex.currencyCode);;
        (result.OTA_HotelAvailRQ).should.to.have.property('Type').to.be.a('string');
        (result.OTA_HotelAvailRQ).should.to.have.property('ID').to.be.a('string');
        (result.OTA_HotelAvailRQ).should.to.have.property('xmlns').to.equal('http://www.opentravel.org/OTA/2003/05');
        (result.OTA_HotelAvailRQ).should.to.have.property('POS').to.be.an('object');
        (result.OTA_HotelAvailRQ).should.to.have.property('AvailRequestSegments').to.be.an('object');
        (result.OTA_HotelAvailRQ).should.to.have.property('TPA_Extensions').to.be.an('object');
        
        (result.OTA_HotelAvailRQ.POS).should.to.have.property('Source').to.be.an('object');
        (result.OTA_HotelAvailRQ.POS.Source).should.to.have.property('RequestorID').to.be.an('object');
        (result.OTA_HotelAvailRQ.POS.Source).should.to.have.property('BookingChannel').to.be.an('object');
        (result.OTA_HotelAvailRQ.POS.Source.RequestorID).should.to.have.property('ID').to.be.a('string');
        (result.OTA_HotelAvailRQ.POS.Source.RequestorID).should.to.have.property('MessagePassword').to.be.a('string');
        (result.OTA_HotelAvailRQ.POS.Source.RequestorID).should.to.have.property('Name').to.be.a('string');
        (result.OTA_HotelAvailRQ.POS.Source.RequestorID).should.to.have.property('Type').to.be.a('string');

        (result.OTA_HotelAvailRQ.AvailRequestSegments).should.to.have.property('AvailRequestSegment').to.be.an('object');
        (result.OTA_HotelAvailRQ.AvailRequestSegments.AvailRequestSegment).should.to.have.property('AvailReqType').to.be.a('string');
        (result.OTA_HotelAvailRQ.AvailRequestSegments.AvailRequestSegment).should.to.have.property('HotelSearchCriteria').to.be.an('array');

        // HotelRef
        result.OTA_HotelAvailRQ.AvailRequestSegments.AvailRequestSegment.HotelSearchCriteria.forEach(h => {
          (h).should.be.an('object').to.have.property('HotelRef').be.an('object');
          validateHotelRef(h.HotelRef);
        });
      });
    });

    describe('#hotelAvailRequestTemplate', () => {
      // decide is it required to test this function
    });
  });
});
