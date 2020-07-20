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
const {
  mapFromOffer
} = require('../../helpers/transformInputData/hotelResNotif');

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

  describe('Order create with offers', () => {

    describe('#mapFromOffer', () => {
      const offer = {
        provider: 'erevmax',
        hotelCode: '07119',
        rateCode: 'LSAVE',
        roomTypeCode: 'ND',
        rates: [
          {
            effectiveDate: '2020-07-02',
            expireDate: '2020-07-03',
            timeUnit: 'Day',
            unitMultiplier: '1',
            currency: 'SEK',
            amountAfterTax: '776.0'
          }
        ],
        guestCounts: [ { type: 'ADT', count: 2 }, { type: 'CHD', count: 1 } ],
        effectiveDate: '2020-07-02',
        expireDate: '2020-07-03',
        amountBeforeTax: '640.0',
        amountAfterTax: '776.0',
        currency: 'SEK'
      };
      const passengers = {
        PAX1: {
          type: 'ADT',
          civility: 'MR',
          lastnames: [ 'Marley' ],
          firstnames: [ 'Bob' ],
          gender: 'Male',
          birthdate: '1980-03-21T00:00:00Z',
          contactInformation: [ '+32123456789', 'contact@org.co.uk' ]
        }
      };
      const card = {
        accountNumber: '4444333322221111',
        brand: 'visa',
        cvv: '737',
        expiryMonth: '10',
        expiryYear: '2020',
        id: 'e6266e16-eb45-4781-9788-271553dc6657',
        type: 'debit'
      };

      it('should to trow if offer has not been provided', async () => {
        (() => mapFromOffer(undefined, passengers, card)).should.to.throw;
        (() => mapFromOffer({}, passengers, card)).should.to.throw;
        (() => mapFromOffer([], passengers, card)).should.to.throw;
      });

      it('should to trow if passengers has not been provided', async () => {
        (() => mapFromOffer(offer, undefined, card)).should.to.throw;
        (() => mapFromOffer(offer, {}, card)).should.to.throw;
        (() => mapFromOffer(offer, [], card)).should.to.throw;
      });

      it('should to trow if card has not been provided', async () => {
        (() => mapFromOffer(offer, passengers, undefined)).should.to.throw;
        (() => mapFromOffer(offer, passengers, {})).should.to.throw;
        (() => mapFromOffer(offer, passengers, [])).should.to.throw;
      });

      it('should fulfill', async () => {
        const result = mapFromOffer(offer, passengers, card);
        (result).should.be.an('object').to.have.property('OTA_HotelResNotifRQ').to.be.an('object');
        (result.OTA_HotelResNotifRQ).should.to.have.property('ResStatus').to.be.a('string');
        (result.OTA_HotelResNotifRQ).should.to.have.property('Version').to.be.a('string');
        (result.OTA_HotelResNotifRQ).should.to.have.property('TimeStamp').to.be.a('string');
        (result.OTA_HotelResNotifRQ).should.to.have.property('xmlns').to.equal('http://www.opentravel.org/OTA/2003/05');
        (result.OTA_HotelResNotifRQ).should.to.have.property('EchoToken').to.be.a('string');
        (result.OTA_HotelResNotifRQ).should.to.have.property('POS').to.be.an('object');
        (result.OTA_HotelResNotifRQ).should.to.have.property('HotelReservations').to.be.an('object');

        (result.OTA_HotelResNotifRQ.POS).should.to.have.property('Source').to.be.an('object');
        (result.OTA_HotelResNotifRQ.POS.Source).should.to.have.property('RequestorID').to.be.an('object');
        (result.OTA_HotelResNotifRQ.POS.Source).should.to.have.property('BookingChannel').to.be.an('object');
        (result.OTA_HotelResNotifRQ.POS.Source.RequestorID).should.to.have.property('ID').to.be.a('string');
        (result.OTA_HotelResNotifRQ.POS.Source.RequestorID).should.to.have.property('Type').to.be.a('string');

        (result.OTA_HotelResNotifRQ.HotelReservations).should.to.have.property('HotelReservation');
        (result.OTA_HotelResNotifRQ.HotelReservations.HotelReservation).should.to.have.property('CreateDateTime').to.match(regex.dateISO);
        (result.OTA_HotelResNotifRQ.HotelReservations.HotelReservation).should.to.have.property('CreatorID').to.be.a('string');
        (result.OTA_HotelResNotifRQ.HotelReservations.HotelReservation).should.to.have.property('ResStatus').to.be.a('string');
        (result.OTA_HotelResNotifRQ.HotelReservations.HotelReservation).should.to.have.property('UniqueID').to.be.an('object');
        (result.OTA_HotelResNotifRQ.HotelReservations.HotelReservation).should.to.have.property('RoomStays').to.be.an('object');
        (result.OTA_HotelResNotifRQ.HotelReservations.HotelReservation).should.to.have.property('ResGuests').to.be.an('object');
        (result.OTA_HotelResNotifRQ.HotelReservations.HotelReservation).should.to.have.property('ResGlobalInfo').to.be.an('object');
      });
    });
  });
});
