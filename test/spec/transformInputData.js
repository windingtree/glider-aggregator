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
const {
  mapNdcRequestData_AC: mapNdcRequestData_AC_seatAvailability
} = require('../../helpers/transformInputData/seatAvailability');
const {
  mapNdcRequestData_AC: mapNdcRequestData_AC_fulfillOrder
} = require('../../helpers/transformInputData/fulfillOrder');
const {
  getACSystemIdOrderCreateRQ,
  mapNdcRequestHeaderData_AC,
  mapNdcRequestData_AC: mapNdcRequestData_AC_createOrder
} = require('../../helpers/transformInputData/createOrder');

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
    {
      'provider': 'AC',
      'airlineCode': 'AC',
      'expiration': '2020-08-03T18:11:53.723Z',
      'offerItems': {
        'X77M7SVPDA-OfferItemID-1': {
          'passengerReferences': '3E6B41DD '
        },
        'HFPDQ29PH7-OfferItemID-2': {
          'passengerReferences': '1C966E35'
        }
      },
      'amountAfterTax': '1036.83',
      'currency': 'CAD',
      'extraData': {
        'offerId': 'H8Z42IS0F2-OfferID-1',
        'segments': [
          {
            'id': 'B69B4WF4RW-SEG1',
            'operator': {
              'operatorType': 'airline',
              'iataCode': 'AC',
              'flightNumber': 'AC0134'
            },
            'Departure': {
              'AirportCode': 'YYC',
              'Date': '2020-09-14',
              'Time': '07:00'
            },
            'Arrival': {
              'AirportCode': 'YYZ',
              'Date': '2020-09-14',
              'Time': '12:50',
              'Terminal': {
                'Name': '1'
              }
            },
            'MarketingCarrier': {
              'AirlineID': 'AC',
              'Name': 'Air Canada',
              'FlightNumber': '134',
              'ResBookDesigCode': 'L'
            },
            'OperatingCarrier': {
              'Disclosures': {
                'Description': {
                  'Text': 'ssGCPeUH4oRvF8SySYd5TW2hGD96yqr9UnlLUkThnLG/17BjuAKyJRzQOOvKf1zI8ekioOTIFxjLK2Q44/2u8oD0eWQcKaLQSVSp+soTuqMcep+YABFdWqrYvC1N3Gl/5mTFuZAO5Ed6Ja5ZbLy4rw=='
                }
              }
            },
            'Equipment': {
              'AircraftCode': '7M8'
            },
            'ClassOfService': {
              'Code': 'L'
            },
            'FlightDetail': {
              'FlightDuration': {
                'Value': ''
              },
              'Stops': {
                'StopQuantity': '0'
              }
            },
            'origin': {
              'locationType': 'airport',
              'iataCode': 'YYC'
            },
            'destination': {
              'locationType': 'airport',
              'iataCode': 'YYZ'
            },
            'departureTime': '2020-09-14T13:00:00.000Z',
            'arrivalTime': '2020-09-14T16:50:00.000Z',
            'aggregationKey': 'ACAC01342020-09-14T13:00:00.000Z2020-09-14T16:50:00.000Z'
          },
          {
            'id': 'G9OG66SX2J-SEG2',
            'operator': {
              'operatorType': 'airline',
              'iataCode': 'RV',
              'flightNumber': 'AC1544'
            },
            'Departure': {
              'AirportCode': 'YYZ',
              'Date': '2020-09-14',
              'Time': '14:50',
              'Terminal': {
                'Name': '1'
              }
            },
            'Arrival': {
              'AirportCode': 'YYT',
              'Date': '2020-09-14',
              'Time': '19:19'
            },
            'MarketingCarrier': {
              'AirlineID': 'AC',
              'Name': 'Air Canada',
              'FlightNumber': '1544',
              'ResBookDesigCode': 'L'
            },
            'OperatingCarrier': {
              'Disclosures': {
                'Description': {
                  'Text': 'ssGCPeUH4oRvF8SySYd5TV8dpcsYUV67DAplC3QvK8JRyNVshs872/HE8VDWF/tNaGtED8EIJYrlpn8XB8pRX6r+QhxHHDS4OduCOeU5xip/veYLBfhQ9w=='
                }
              }
            },
            'Equipment': {
              'AircraftCode': '321'
            },
            'ClassOfService': {
              'Code': 'L'
            },
            'FlightDetail': {
              'FlightDuration': {
                'Value': ''
              },
              'Stops': {
                'StopQuantity': '0'
              }
            },
            'origin': {
              'locationType': 'airport',
              'iataCode': 'YYZ'
            },
            'destination': {
              'locationType': 'airport',
              'iataCode': 'YYT'
            },
            'departureTime': '2020-09-14T18:50:00.000Z',
            'arrivalTime': '2020-09-14T21:49:00.000Z',
            'aggregationKey': 'ACAC15442020-09-14T18:50:00.000Z2020-09-14T21:49:00.000Z'
          }
        ],
        'destinations': [
          {
            'id': 'ZDD89UNQMB-OD1',
            'DepartureCode': 'YYC',
            'ArrivalCode': 'YYT',
            'FlightReferences': 'B69B4WF4RW-SEG1 G9OG66SX2J-SEG2'
          }
        ],
        'passengers': {
          'ADT': ['3E6B41DD'],
          'CHD': ['1C966E35']
        },
        'mappedPassengers': {
          '3E6B41DD': 'HZVZHYSXJY-T1',
          'undefined': 'M70ZNQOMCV-T2',
          '1C966E35': 'HPGK78FGON-T3'
        }
      }
    }
  ];
  const card = {
    accountNumber: '4444333322221111',
    brand: 'visa',
    cvv: '737',
    expiryMonth: '10',
    expiryYear: '2020',
    id: 'e6266e16-eb45-4781-9788-271553dc6657',
    type: 'debit'
  };

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

  describe('offerPrice', () => {

    describe('#mapNdcRequestData_AC:offerPrice', () => {

      it('should to throw if wrong config has been provided', async () => {
        docIds.forEach(docType => {
          (() => mapNdcRequestData_AC_offerPrice(undefined, offers, body, docType)).should.to.throw;
          (() => mapNdcRequestData_AC_offerPrice('', offers, body, docType)).should.to.throw;
          (() => mapNdcRequestData_AC_offerPrice([], offers, body, docType)).should.to.throw;
        });
      });
  
      it('should to throw if wrong offers object has been provided', async () => {
        docIds.forEach(docType => {
          (() => mapNdcRequestData_AC_offerPrice(airCanadaConfig, undefined, body, docType)).should.to.throw;
          (() => mapNdcRequestData_AC_offerPrice(airCanadaConfig, '', body, docType)).should.to.throw;
          (() => mapNdcRequestData_AC_offerPrice(airCanadaConfig, {}, body, docType)).should.to.throw;
        });
      });
  
      it('should to throw if wrong body has been provided', async () => {
        const brokenBody = Object.assign({}, body, {
          itinerary: undefined
        });
        docIds.forEach(docType => {
          (() => mapNdcRequestData_AC_offerPrice(airCanadaConfig, offers, undefined, docType)).should.to.throw;
          (() => mapNdcRequestData_AC_offerPrice(airCanadaConfig, offers, [], docType)).should.to.throw;
          (() => mapNdcRequestData_AC_offerPrice(airCanadaConfig, offers, brokenBody, docType)).should.to.throw;
        });
      });
      
      it('should map request data', async () => {
        docIds.forEach(docType => {
          const result = mapNdcRequestData_AC_offerPrice(
            airCanadaConfig,
            offers,
            body,
            docType
          );
          // validate first level only
          (result).should.to.be.an('object');
          (result).should.to.have.property('PointOfSale').to.be.an('object');
          (result).should.to.have.property('Party').to.be.an('object');
          (result).should.to.have.property('Document').to.be.an('object')
            .to.have.property('@id').to.equal(docType)
            .to.be.oneOf(docIds);
          (result).should.to.have.property('Query').to.be.an('object')
            .to.have.property('Offer');
          (result).should.to.have.property('DataLists').to.be.an('object');
        });
      });
    });
  });

  describe('seatAvailability', () => {

    describe('#mapNdcRequestData_AC:seatAvailability', () => {

      it('should to throw if wrong config has been provided', async () => {
        docIds.forEach(docType => {
          (() => mapNdcRequestData_AC_seatAvailability(undefined, offers, docType)).should.to.throw;
          (() => mapNdcRequestData_AC_seatAvailability('', offers, docType)).should.to.throw;
          (() => mapNdcRequestData_AC_seatAvailability([], offers, docType)).should.to.throw;
        });
      });
  
      it('should to throw if wrong offers object has been provided', async () => {
        docIds.forEach(docType => {
          (() => mapNdcRequestData_AC_seatAvailability(airCanadaConfig, undefined, docType)).should.to.throw;
          (() => mapNdcRequestData_AC_seatAvailability(airCanadaConfig, '', docType)).should.to.throw;
          (() => mapNdcRequestData_AC_seatAvailability(airCanadaConfig, {}, docType)).should.to.throw;
        });
      });
  
      it('should map request data', async () => {
        docIds.forEach(docType => {
          const result = mapNdcRequestData_AC_seatAvailability(
            airCanadaConfig,
            offers,
            docType
          );
          // validate first level only
          (result).should.to.be.an('object');
          (result).should.to.have.property('PointOfSale').to.be.an('object');
          (result).should.to.have.property('Party').to.be.an('object');
          (result).should.to.have.property('Document').to.be.an('object')
            .to.have.property('@id').to.equal(docType)
            .to.be.oneOf(docIds);
          (result).should.to.have.property('Query').to.be.an('object')
            .to.have.property('Offer');
          (result).should.to.have.property('DataLists').to.be.an('object');
        });
      });
    });
  });

  describe('fulfillOrder', () => {

    describe('#mapNdcRequestData_AC:fulfillOrder', () => {
      const guaranteeClaim = {
        card
      };
      const order = {
        orderId: 'e6266e16-eb45-4781-9788-271553dc6657',
        order: {
          order: {
            price: {
              currency: 'EN',
              public: ''
            }
          }
        }
      };

      it('should to throw if wrong config has been provided', async () => {
        (() => mapNdcRequestData_AC_fulfillOrder(undefined, order, {}, guaranteeClaim)).should.to.throw;
        (() => mapNdcRequestData_AC_fulfillOrder('', order, {}, guaranteeClaim)).should.to.throw;
        (() => mapNdcRequestData_AC_fulfillOrder([], order, {}, guaranteeClaim)).should.to.throw;
      });
  
      it('should to throw if wrong order object has been provided', async () => {
        (() => mapNdcRequestData_AC_fulfillOrder(airCanadaConfig, undefined, {}, guaranteeClaim)).should.to.throw;
        (() => mapNdcRequestData_AC_fulfillOrder(airCanadaConfig, '', {}, guaranteeClaim)).should.to.throw;
        (() => mapNdcRequestData_AC_fulfillOrder(airCanadaConfig, {}, {}, guaranteeClaim)).should.to.throw;
      });

      it('should to throw if wrong guaranteeClaim object has been provided', async () => {
        (() => mapNdcRequestData_AC_fulfillOrder(airCanadaConfig, order, {}, undefined)).should.to.throw;
        (() => mapNdcRequestData_AC_fulfillOrder(airCanadaConfig, order, {}, '')).should.to.throw;
        (() => mapNdcRequestData_AC_fulfillOrder(airCanadaConfig, order, {}, {})).should.to.throw;
      });
  
      it('should map request data', async () => {
        const result = mapNdcRequestData_AC_fulfillOrder(
          airCanadaConfig,
          order,
          {},
          guaranteeClaim
        );
        // validate first level only
        (result).should.to.be.an('object');
        (result).should.to.have.property('apiKey').to.be.a('string');
        (result).should.to.have.property('commission').to.be.a('string');
        (result).should.to.have.property('baseUrl').to.be.a('string')
          .to.equal('https://ndchub.mconnect.aero/messaging/v2/ndc-exchange/');
        (result).should.to.have.property('baseUrlPci').to.be.a('string')
          .to.equal('https://pci.ndchub.mconnect.aero/messaging/v2/ndc-exchange/');
        (result).should.to.have.property('PointOfSale').to.be.an('object');
        (result).should.to.have.property('Document').to.be.an('object')
          .to.have.property('@id').to.be.oneOf(docIds);
        (result).should.to.have.property('Party').to.be.an('object');
        (result).should.to.have.property('Query').to.be.an('object')
          .to.have.property('OrderID').to.match(regex.uuid);
        (result.Query).should.to.have.property('ActionContext').to.be.a('number');
        (result.Query).should.to.have.property('Payments').to.be.an('object');
      });
    });
  });

  describe('createOrder', () => {
    const guaranteeClaim = {
      card
    };
    
    describe('#getACSystemIdOrderCreateRQ', () => {
      const environments = [
        {
          value: 'development',
          pci: true,
          res: 'DEV-PCI'
        },
        {
          value: 'staging',
          pci: true,
          res: 'DEV-PCI'
        },
        {
          value: 'production',
          pci: true,
          res: 'PROD'
        },
        {
          value: 'development',
          pci: false,
          res: 'DEV'
        },
        {
          value: 'staging',
          pci: false,
          res: 'DEV'
        },
        {
          value: 'production',
          pci: false,
          res: 'PROD'
        }
      ];

      after(async () => {
        process.env.TESTING_ENV = undefined;
      });

      it('should map request data', async () => {
        environments.forEach(env => {
          process.env.TESTING_ENV = env.value;
          const result = getACSystemIdOrderCreateRQ(env.pci);
          (result).should.to.equal(env.res);
        });
      });
    });

    describe('#mapNdcRequestHeaderData_AC', () => {
      const environments = [
        {
          value: 'development',
          guaranteeClaim,
          res: 'DEV-PCI'
        },
        {
          value: 'staging',
          guaranteeClaim,
          res: 'DEV-PCI'
        },
        {
          value: 'production',
          guaranteeClaim,
          res: 'PROD-PCI'
        },
        {
          value: 'development',
          guaranteeClaim: undefined,
          res: 'DEV'
        },
        {
          value: 'staging',
          guaranteeClaim: undefined,
          res: 'DEV'
        },
        {
          value: 'production',
          guaranteeClaim: undefined,
          res: 'PROD'
        }
      ];

      after(async () => {
        process.env.TESTING_ENV = undefined;
      });

      it('should to throw if wrong guaranteeClaim has been provided', async () => {
        (() => mapNdcRequestHeaderData_AC('')).should.to.throw;
        (() => mapNdcRequestHeaderData_AC([])).should.to.throw;
        (() => mapNdcRequestHeaderData_AC({})).should.to.throw;
      });

      it('should map request data', async () => {
        environments.forEach(env => {
          process.env.TESTING_ENV = env.value;
          const result = mapNdcRequestHeaderData_AC(env.guaranteeClaim);
          (result).should.to.be.an('object');
          (result).should.to.have.property('Function').to.equal('OrderCreateRQ');
          (result).should.to.have.property('SchemaType').to.equal('NDC');
          (result).should.to.have.property('SchemaVersion').to.equal('YY.2017.2');
          (result).should.to.have.property('Sender').to.be.an('object');
          (result.Sender).should.to.have.property('Address').to.be.an('object')
            .to.have.property('Company').to.equal('WindingTree');
          (result.Sender.Address).should.to.have.property('NDCSystemId')
            .to.equal(env.res);
        });
      });
    });

    describe('#mapNdcRequestData_AC:createOrder', () => {
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
        currency: 'SEK',
        'offerItems': {
          'HAS54TFEWO-OfferItemID-83': {
            'passengerReferences': '2251290F 94E54927'
          },
          'KPIC3IX1DH-OfferItemID-84': {
            'passengerReferences': '2251290F'
          }
        },
        extraData: {
          'offerId': 'M8RJJL3J8X-OfferID-1',
          'segments': [
            {
              'id': 'HIXRSLG2KS-SEG1',
              'operator': {
                'operatorType': 'airline',
                'iataCode': 'AC',
                'flightNumber': 'AC0134'
              },
              'Departure': {
                'AirportCode': 'YYC',
                'Date': '2020-09-14',
                'Time': '07:00'
              },
              'Arrival': {
                'AirportCode': 'YYZ',
                'Date': '2020-09-14',
                'Time': '12:50',
                'Terminal': {
                  'Name': '1'
                }
              },
              'MarketingCarrier': {
                'AirlineID': 'AC',
                'Name': 'Air Canada',
                'FlightNumber': '134',
                'ResBookDesigCode': 'L'
              },
              'OperatingCarrier': {
                'Disclosures': {
                  'Description': {
                    'Text': 'R43JX9KFlNGatxTgPk4W7tezJWT2Vuj8UnlLUkThnLG/17BjuAKyJRzQOOvKf1zI8ekioOTIFxjLK2Q44/2u8oD0eWQcKaLQSVSp+soTuqMcep+YABFdWqrYvC1N3Gl/5mTFuZAO5Ed6Ja5ZbLy4rw=='
                  }
                }
              },
              'Equipment': {
                'AircraftCode': '7M8'
              },
              'ClassOfService': {
                'Code': 'L'
              },
              'FlightDetail': {
                'FlightDuration': {
                  'Value': ''
                },
                'Stops': {
                  'StopQuantity': '0'
                }
              },
              'origin': {
                'locationType': 'airport',
                'iataCode': 'YYC'
              },
              'destination': {
                'locationType': 'airport',
                'iataCode': 'YYZ'
              },
              'departureTime': '2020-09-14T13:00:00.000Z',
              'arrivalTime': '2020-09-14T16:50:00.000Z',
              'aggregationKey': 'ACAC01342020-09-14T13:00:00.000Z2020-09-14T16:50:00.000Z'
            },
            {
              'id': 'DK5P6ZER15-SEG2',
              'operator': {
                'operatorType': 'airline',
                'iataCode': 'RV',
                'flightNumber': 'AC1544'
              },
              'Departure': {
                'AirportCode': 'YYZ',
                'Date': '2020-09-14',
                'Time': '14:50',
                'Terminal': {
                  'Name': '1'
                }
              },
              'Arrival': {
                'AirportCode': 'YYT',
                'Date': '2020-09-14',
                'Time': '19:19'
              },
              'MarketingCarrier': {
                'AirlineID': 'AC',
                'Name': 'Air Canada',
                'FlightNumber': '1544',
                'ResBookDesigCode': 'L'
              },
              'OperatingCarrier': {
                'Disclosures': {
                  'Description': {
                    'Text': 'R43JX9KFlNGatxTgPk4W7jNn8zCOXqoJDAplC3QvK8JRyNVshs872/HE8VDWF/tNaGtED8EIJYrlpn8XB8pRX6r+QhxHHDS4OduCOeU5xip/veYLBfhQ9w=='
                  }
                }
              },
              'Equipment': {
                'AircraftCode': '321'
              },
              'ClassOfService': {
                'Code': 'L'
              },
              'FlightDetail': {
                'FlightDuration': {
                  'Value': ''
                },
                'Stops': {
                  'StopQuantity': '0'
                }
              },
              'origin': {
                'locationType': 'airport',
                'iataCode': 'YYZ'
              },
              'destination': {
                'locationType': 'airport',
                'iataCode': 'YYT'
              },
              'departureTime': '2020-09-14T18:50:00.000Z',
              'arrivalTime': '2020-09-14T21:49:00.000Z',
              'aggregationKey': 'ACAC15442020-09-14T18:50:00.000Z2020-09-14T21:49:00.000Z'
            }
          ],
          'destinations': [
            {
              'id': 'V1I4BXC0HW-OD1',
              'DepartureCode': 'YYC',
              'ArrivalCode': 'YYT',
              'FlightReferences': 'HIXRSLG2KS-SEG1 DK5P6ZER15-SEG2'
            }
          ],
          'passengers': {
            'ADT': ['2251290F'],
            'CHD': ['94E54927']
          },
          'mappedPassengers': {
            '2251290F': 'GS6AQGWK16-T1',
            '94E54927': 'V2BNN2YR9L-T3'
          },
          'options': [],
          'seats': [
            {
              'code': 'divNonAir05.ASPW_0',
              'name': 'Lounge Access',
              'description': 'An access to the Exclusive Lounge Access at the departure',
              'segment': 'QUFRM4G5V4-SEG1',
              'passenger': 'PAX1',
              'seatNumber': '12A',
              'price': {
                'currency': 'CAD',
                'public': '50.40',
                'commission': '0.00',
                'taxes': '2.40'
              },
              'taxes': []
            },
            {
              'code': 'divNonAir15.ASPW_1',
              'name': 'Lounge Access',
              'description': 'An access to the Exclusive Lounge Access at the departure',
              'segment': 'QUFRM4G5V4-SEG1',
              'passenger': 'PAX1',
              'seatNumber': '12A',
              'price': {
                'currency': 'CAD',
                'public': '43.05',
                'commission': '0.00',
                'taxes': '2.05'
              },
              'taxes': []
            }
          ]
        }
      };
      const body = {
        'offerId': '11111111-2222-3333-4444-000000000001',
        'guaranteeId': '02a1a7c0-3ff8-4e12-a3ba-65d57e1e9276',
        'passengers': {
          'PAX1': {
            'type': 'ADT',
            'civility': 'MR',
            'lastnames': [
              'Marley'
            ],
            'firstnames': [
              'Bob'
            ],
            'gender': 'Male',
            'birthdate': '1980-03-21T00:00:00Z',
            'contactInformation': [
              '+32123456789',
              'contact@org.co.uk'
            ]
          }
        }
      };

      it('should to throw if wrong config has been provided', async () => {
        (() => mapNdcRequestData_AC_createOrder('', offer, body, guaranteeClaim, true)).should.to.throw;
        (() => mapNdcRequestData_AC_createOrder([], offer, body, guaranteeClaim, true)).should.to.throw;
        (() => mapNdcRequestData_AC_createOrder({}, offer, body, guaranteeClaim, true)).should.to.throw;
      });

      it('should to throw if wrong offer has been provided', async () => {
        (() => mapNdcRequestData_AC_createOrder(airCanadaConfig, '', body, guaranteeClaim, true)).should.to.throw;
        (() => mapNdcRequestData_AC_createOrder(airCanadaConfig, [], body, guaranteeClaim, true)).should.to.throw;
        (() => mapNdcRequestData_AC_createOrder(airCanadaConfig, {}, body, guaranteeClaim, true)).should.to.throw;
      });

      it('should to throw if wrong body has been provided', async () => {
        (() => mapNdcRequestData_AC_createOrder(airCanadaConfig, body, '', guaranteeClaim, true)).should.to.throw;
        (() => mapNdcRequestData_AC_createOrder(airCanadaConfig, body, [], guaranteeClaim, true)).should.to.throw;
        (() => mapNdcRequestData_AC_createOrder(airCanadaConfig, body, {}, guaranteeClaim, true)).should.to.throw;
      });

      it('should map request data', async () => {
        docIds.forEach(docType => {
          const noSeatsOffer = JSON.parse(JSON.stringify(offer));
          noSeatsOffer.extraData.seats = undefined;
          let result = mapNdcRequestData_AC_createOrder(
            airCanadaConfig,
            noSeatsOffer,
            body,
            guaranteeClaim,
            docType
          );
          // validate first level only
          (result).should.to.be.an('object');
          (result).should.to.have.property('PointOfSale').to.be.an('object');
          (result).should.to.have.property('Party').to.be.an('object');
          (result).should.to.have.property('Document').to.be.an('object')
            .to.have.property('@id').to.equal(docType)
            .to.be.oneOf(docIds);
          (result).should.to.have.property('Query').to.be.an('object')
            .to.have.property('Order')
            .to.be.an('object')
            .to.have.property('Offer')
            .to.be.an('object')
            .to.have.property('OfferItem')
            .to.be.an('array');
          (result.Query).should.to.have.property('Payments').to.be.an('object');
          (result.Query).should.to.have.property('DataLists').to.be.an('object');

          result = mapNdcRequestData_AC_createOrder(
            airCanadaConfig,
            offer,
            body,
            guaranteeClaim,
            docType
          );
          (result).should.to.have.property('Query').to.be.an('object')
            .to.have.property('Order')
            .to.be.an('object')
            .to.have.property('OrderItem')
            .to.be.an('array');
        });
      });
    });
  });
});
