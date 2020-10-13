const regex = require('../../../../../test/helpers/matches');
const { mapRequestData } = require('./hotelAvail');

require('chai').should();

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

describe('hotels/erevmax/transformInputData', () => {

  describe('#mapRequestData', () => {
    const hotelCodes = [
      '02034',
      '02035',
      '02036',
    ];

    const body = {
      accommodation: {
        location: {
          rectangle: {
            north: '59',
            south: '57',
            west: '11',
            east: '20',
          },
        },
        arrival: '2020-09-02T00:00:00Z',
        departure: '2020-09-03T00:00:00Z',
      },
      passengers: [
        {
          type: 'ADT',
          count: 2,
        },
        {
          type: 'CHD',
          count: 1,
        },
      ],
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
        Object.assign({}, body, { accommodation: undefined }),
      )).should.to.throw;
      // undefined arrival
      (() => mapRequestData(
        hotelCodes,
        Object.assign({}, body, {
          accommodation: {
            arrival: undefined,
            departure: '2020-09-03T00:00:00Z',
          },
        }),
      )).should.to.throw;
      // empty arrival
      (() => mapRequestData(
        hotelCodes,
        Object.assign({}, body, {
          accommodation: {
            arrival: '',
            departure: '2020-09-03T00:00:00Z',
          },
        }),
      )).should.to.throw;
    });

    it('should throw if wrong passengers property has been provided', async () => {
      // undefined passengers
      (() => mapRequestData(
        hotelCodes,
        Object.assign({}, body, { passengers: undefined }),
      )).should.to.throw;
      // broken passengers
      (() => mapRequestData(
        hotelCodes,
        Object.assign({}, body, { passengers: {} }),
      )).should.to.throw;
      // empty passengers
      (() => mapRequestData(
        hotelCodes,
        Object.assign({}, body, { passengers: [] }),
      )).should.to.throw;
    });

    it('should map request data', async () => {
      const result = mapRequestData(hotelCodes, body);

      (result).should.be.an('object').to.have.property('OTA_HotelAvailRQ').to.be.an('object');
      (result.OTA_HotelAvailRQ).should.to.have.property('TimeStamp').to.match(regex.dateISO);
      (result.OTA_HotelAvailRQ).should.to.have.property('Version').to.match(regex.dotVersioning);
      (result.OTA_HotelAvailRQ).should.to.have.property('PrimaryLangID').to.match(regex.langCode);
      (result.OTA_HotelAvailRQ).should.to.have.property('AvailRatesOnly').to.be.a('boolean');
      (result.OTA_HotelAvailRQ).should.to.have.property('RequestedCurrency').to.match(regex.currencyCode);
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
