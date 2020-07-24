const regex = require('../helpers/matches');
const {
  airCanadaConfig
} = require('../../config');
const {
  mapRequestData
} = require('../../helpers/transformInputData/hotelAvail');
const {
  mapFromOffer,
  buildCustomerAddress
} = require('../../helpers/transformInputData/hotelResNotif');
const {
  expandPassengers,
  mapNdcRequestData_AC
} = require('../../helpers/transformInputData/searchOffers');
const {
  mapNdcRequestData_AC: mapNdcRequestData_AC_offerPrice
} = require('../../helpers/transformInputData/offerPrice');

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

describe('transformInputData', () => {

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

  describe('#buildCustomerAddress', () => {
    const pax = {
      type: 'ADT',
      civility: 'MR',
      lastnames: [ 'Marley' ],
      firstnames: [ 'Bob' ],
      gender: 'Male',
      birthdate: '1980-03-21T00:00:00Z',
      contactInformation: [ '+32123456789', 'contact@org.co.uk' ],
      address: {
        lines: [
          'str. One',
          'flat 2'
        ],
        city: 'City',
        postalCode: '1234567',
        subdivision: '',
        country: 'PL'
      }
    };

    it('should to throw if wrong pax has been provided', async () => {
      (() => buildCustomerAddress(Object.assign({}, pax, { address: 'wrongType' }))).should.to.throw;
    });

    it('should build customer address', async () => {
      const result = buildCustomerAddress(pax);
      (result).should.be.an('object').to.have.property('Type').to.equal('1');
      (result).should.to.have.property('AddressLines').to.deep.equal(pax.address.lines);
      (result).should.to.have.property('CityName').to.equal(pax.address.city);
      (result).should.to.have.property('PostalCode').to.equal(pax.address.postalCode);
      (result).should.to.have.property('StateProv').to.equal(pax.address.subdivision);
      (result).should.to.have.property('CountryName').to.be.an('object')
        .to.have.property('Code').to.equal(pax.address.country);
    });
  });

  describe('#expandPassengers', () => {
    const passengers = [
      {
        type: 'ADT',
        count: 2
      },
      {
        type: 'CHD'
      }
    ];

    it('should to throw if wrong passengers provided', async () => {
      (() => expandPassengers(undefined)).should.to.throw;
      (() => expandPassengers('wrongType')).should.to.throw;
      (() => expandPassengers({})).should.to.throw;
    });

    it('should expand passengers from request', async () => {
      const result = expandPassengers(passengers);
      (result).should.be.an('array');
      result.forEach(p => {
        (p).should.be.an('object').to.have.property('type').to.match(/^ADT|CHD$/);
      });
    });
  });

  describe('#mapNdcRequestData_AC', () => {
    const docIds = [
      'OneWay',
      'Return'
    ];
    const body = {
      'itinerary': {
        'segments': [
          {
            'origin': {
              'locationType': 'airport',
              'iataCode': 'YYC'
            },
            'destination': {
              'locationType': 'airport',
              'iataCode': 'YYT'
            },
            'departureTime': '2020-09-14T00:00:00Z'
          }
        ]
      },
      'passengers': [
        {
          'type': 'ADT',
          'count': 2
        },
        {
          'type': 'CHD'
        }
      ]
    };

    it('should to throw if wrong config has been provided', async () => {
      docIds.forEach(docType => {
        (() => mapNdcRequestData_AC(undefined, body, docType)).should.to.throw;
        (() => mapNdcRequestData_AC('', body, docType)).should.to.throw;
        (() => mapNdcRequestData_AC([], body, docType)).should.to.throw;
      });
    });

    it('should to throw if wrong body has been provided', async () => {
      const brokenBody = Object.assign({}, body, {
        itinerary: undefined
      });
      docIds.forEach(docType => {
        (() => mapNdcRequestData_AC(airCanadaConfig, undefined, docType)).should.to.throw;
        (() => mapNdcRequestData_AC(airCanadaConfig, [], docType)).should.to.throw;
        (() => mapNdcRequestData_AC(airCanadaConfig, brokenBody, docType)).should.to.throw;
      });
    });

    it('should produce broken data if wrong docType has been provided', async () => {
      const result = mapNdcRequestData_AC(airCanadaConfig, body, 'unknownType');
      (result).should.to.have.property('Document').to.be.an('object')
        .to.have.property('@id').to.not.be.oneOf(docIds);
    });

    it('should map request data', async () => {
      docIds.forEach(docType => {
        const result = mapNdcRequestData_AC(airCanadaConfig, body, docType);
        // validate first level only
        (result).should.to.be.an('object');
        (result).should.to.have.property('PointOfSale').to.be.an('object');
        (result).should.to.have.property('Party').to.be.an('object');
        (result).should.to.have.property('Document').to.be.an('object')
          .to.have.property('@id').to.equal(docType)
          .to.be.oneOf(docIds);
        (result).should.to.have.property('CoreQuery').to.be.an('object');
        (result).should.to.have.property('DataLists').to.be.an('object');
      });
    });
  });

  describe.skip('#mapNdcRequestData_AC:offerPrice', () => {
    const docIds = [
      'OneWay',
      'Return'
    ];
    const body = [
      {
        'code': 'divNonAir11.LGAC1',
        'name': 'Lounge Access',
        'description': 'An access to the Exclusive Lounge Access at the departure',
        'segment': 'HW9EJ7XAC7-SEG1',
        'passenger': 'PAX1',
        'seatNumber': '12C',
        'price': {
          'currency': 'EUR',
          'private': '40.00',
          'public': '40.00',
          'commission': '40.00',
          'taxes': '40.00'
        },
        'taxes': [
          {
            'amount': '40.00',
            'code': 'CA',
            'description': 'Air Travellers Security Charge (ATSC)'
          }
        ]
      }
    ];
    const offers = [

    ];

    it('should map request data', async () => {
      docIds.forEach(docType => {
        const result = mapNdcRequestData_AC_offerPrice(
          airCanadaConfig,
          offers,
          body,
          docType
        );
        console.log(result);
      });
    });
  });
});
