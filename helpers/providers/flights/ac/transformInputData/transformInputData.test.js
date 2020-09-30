const regex = require('../../../../../test/helpers/matches');
const {
  airCanadaConfig,
} = require('../../../../../config');
const { expandPassengers } = require('../../../../../helpers/providers/flights/ndc/transformInputData/expandPassengers');
const { mapNdcRequestData_AC } = require('./searchOffers');
const {
  mapNdcRequestData_AC: mapNdcRequestData_AC_offerPrice,
} = require('./offerPrice');
const {
  mapNdcRequestData_AC: mapNdcRequestData_AC_seatAvailability,
} = require('./seatAvailability');
const {
  mapNdcRequestData_AC: mapNdcRequestData_AC_fulfillOrder,
} = require('./fulfillOrder');
const {
  getACSystemIdOrderCreateRQ,
  mapNdcRequestHeaderData_AC,
  mapNdcRequestData_AC: mapNdcRequestData_AC_createOrder,
} = require('./createOrder');

require('chai').should();


describe('providers/flights/ac/transformInputData', () => {
  const docIds = [
    'OneWay',
    'Return',
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
        'taxes': '40.00',
      },
      'taxes': [
        {
          'amount': '40.00',
          'code': 'CA',
          'description': 'Air Travellers Security Charge (ATSC)',
        },
      ],
    },
  ];
  const offers = [
    {
      'provider': 'AC',
      'airlineCode': 'AC',
      'expiration': '2020-08-03T18:11:53.723Z',
      'offerItems': {
        'X77M7SVPDA-OfferItemID-1': {
          'passengerReferences': '3E6B41DD ',
        },
        'HFPDQ29PH7-OfferItemID-2': {
          'passengerReferences': '1C966E35',
        },
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
              'flightNumber': 'AC0134',
            },
            'Departure': {
              'AirportCode': 'YYC',
              'Date': '2020-09-14',
              'Time': '07:00',
            },
            'Arrival': {
              'AirportCode': 'YYZ',
              'Date': '2020-09-14',
              'Time': '12:50',
              'Terminal': {
                'Name': '1',
              },
            },
            'MarketingCarrier': {
              'AirlineID': 'AC',
              'Name': 'Air Canada',
              'FlightNumber': '134',
              'ResBookDesigCode': 'L',
            },
            'OperatingCarrier': {
              'Disclosures': {
                'Description': {
                  'Text': 'ssGCPeUH4oRvF8SySYd5TW2hGD96yqr9UnlLUkThnLG/17BjuAKyJRzQOOvKf1zI8ekioOTIFxjLK2Q44/2u8oD0eWQcKaLQSVSp+soTuqMcep+YABFdWqrYvC1N3Gl/5mTFuZAO5Ed6Ja5ZbLy4rw==',
                },
              },
            },
            'Equipment': {
              'AircraftCode': '7M8',
            },
            'ClassOfService': {
              'Code': 'L',
            },
            'FlightDetail': {
              'FlightDuration': {
                'Value': '',
              },
              'Stops': {
                'StopQuantity': '0',
              },
            },
            'origin': {
              'locationType': 'airport',
              'iataCode': 'YYC',
            },
            'destination': {
              'locationType': 'airport',
              'iataCode': 'YYZ',
            },
            'departureTime': '2020-09-14T13:00:00.000Z',
            'arrivalTime': '2020-09-14T16:50:00.000Z',
            'aggregationKey': 'ACAC01342020-09-14T13:00:00.000Z2020-09-14T16:50:00.000Z',
          },
          {
            'id': 'G9OG66SX2J-SEG2',
            'operator': {
              'operatorType': 'airline',
              'iataCode': 'RV',
              'flightNumber': 'AC1544',
            },
            'Departure': {
              'AirportCode': 'YYZ',
              'Date': '2020-09-14',
              'Time': '14:50',
              'Terminal': {
                'Name': '1',
              },
            },
            'Arrival': {
              'AirportCode': 'YYT',
              'Date': '2020-09-14',
              'Time': '19:19',
            },
            'MarketingCarrier': {
              'AirlineID': 'AC',
              'Name': 'Air Canada',
              'FlightNumber': '1544',
              'ResBookDesigCode': 'L',
            },
            'OperatingCarrier': {
              'Disclosures': {
                'Description': {
                  'Text': 'ssGCPeUH4oRvF8SySYd5TV8dpcsYUV67DAplC3QvK8JRyNVshs872/HE8VDWF/tNaGtED8EIJYrlpn8XB8pRX6r+QhxHHDS4OduCOeU5xip/veYLBfhQ9w==',
                },
              },
            },
            'Equipment': {
              'AircraftCode': '321',
            },
            'ClassOfService': {
              'Code': 'L',
            },
            'FlightDetail': {
              'FlightDuration': {
                'Value': '',
              },
              'Stops': {
                'StopQuantity': '0',
              },
            },
            'origin': {
              'locationType': 'airport',
              'iataCode': 'YYZ',
            },
            'destination': {
              'locationType': 'airport',
              'iataCode': 'YYT',
            },
            'departureTime': '2020-09-14T18:50:00.000Z',
            'arrivalTime': '2020-09-14T21:49:00.000Z',
            'aggregationKey': 'ACAC15442020-09-14T18:50:00.000Z2020-09-14T21:49:00.000Z',
          },
        ],
        'destinations': [
          {
            'id': 'ZDD89UNQMB-OD1',
            'DepartureCode': 'YYC',
            'ArrivalCode': 'YYT',
            'FlightReferences': 'B69B4WF4RW-SEG1 G9OG66SX2J-SEG2',
          },
        ],
        'passengers': {
          'ADT': ['3E6B41DD'],
          'CHD': ['1C966E35'],
        },
        'mappedPassengers': {
          '3E6B41DD': 'HZVZHYSXJY-T1',
          'undefined': 'M70ZNQOMCV-T2',
          '1C966E35': 'HPGK78FGON-T3',
        },
      },
    },
  ];
  const card = {
    accountNumber: '4444333322221111',
    brand: 'visa',
    cvv: '737',
    expiryMonth: '10',
    expiryYear: '2020',
    id: 'e6266e16-eb45-4781-9788-271553dc6657',
    type: 'debit',
  };



  describe('#expandPassengers', () => {
    const passengers = [
      {
        type: 'ADT',
        count: 2,
      },
      {
        type: 'CHD',
      },
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
              'iataCode': 'YYC',
            },
            'destination': {
              'locationType': 'airport',
              'iataCode': 'YYT',
            },
            'departureTime': '2020-09-14T00:00:00Z',
          },
        ],
      },
      'passengers': [
        {
          'type': 'ADT',
          'count': 2,
        },
        {
          'type': 'CHD',
        },
      ],
    };
    const { itinerary, passengers } = body;
    it('should to throw if wrong config has been provided', async () => {
      docIds.forEach(docType => {
        (() => mapNdcRequestData_AC(undefined, itinerary, passengers, docType)).should.to.throw;
        (() => mapNdcRequestData_AC('', itinerary, passengers, docType)).should.to.throw;
        (() => mapNdcRequestData_AC([], itinerary, passengers, docType)).should.to.throw;
      });
    });

    it('should to throw if wrong body has been provided', async () => {
      docIds.forEach(docType => {
        (() => mapNdcRequestData_AC(airCanadaConfig, undefined, passengers, docType)).should.to.throw;
        (() => mapNdcRequestData_AC(airCanadaConfig, [], passengers, docType)).should.to.throw;
        (() => mapNdcRequestData_AC(airCanadaConfig, {}, passengers, docType)).should.to.throw;

        (() => mapNdcRequestData_AC(airCanadaConfig, itinerary, undefined, docType)).should.to.throw;
        (() => mapNdcRequestData_AC(airCanadaConfig, itinerary, [], docType)).should.to.throw;
        (() => mapNdcRequestData_AC(airCanadaConfig, itinerary, {}, docType)).should.to.throw;
      });
    });

    it('should produce broken data if wrong docType has been provided', async () => {
      const result = mapNdcRequestData_AC(airCanadaConfig, itinerary, passengers, 'unknownType');
      (result).should.to.have.property('Document').to.be.an('object')
        .to.have.property('@id').to.not.be.oneOf(docIds);
    });

    it('should map request data', async () => {
      docIds.forEach(docType => {
        const result = mapNdcRequestData_AC(airCanadaConfig, itinerary, passengers, docType);
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
          itinerary: undefined,
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
            docType,
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
            docType,
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
        card,
      };
      const order = {
        orderId: 'e6266e16-eb45-4781-9788-271553dc6657',
        order: {
          order: {
            price: {
              currency: 'EN',
              public: '',
            },
          },
        },
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
          guaranteeClaim,
        );
        // validate first level only
        (result).should.to.be.an('object');
        // (result).should.to.have.property('apiKey').to.be.a('string');
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
      card,
    };

    describe('#getACSystemIdOrderCreateRQ', () => {
      const environments = [
        {
          value: 'development',
          pci: true,
          res: 'DEV-PCI',
        },
        {
          value: 'staging',
          pci: true,
          res: 'DEV-PCI',
        },
        {
          value: 'production',
          pci: true,
          res: 'PROD',
        },
        {
          value: 'development',
          pci: false,
          res: 'DEV',
        },
        {
          value: 'staging',
          pci: false,
          res: 'DEV',
        },
        {
          value: 'production',
          pci: false,
          res: 'PROD',
        },
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
          res: 'DEV-PCI',
        },
        {
          value: 'staging',
          guaranteeClaim,
          res: 'DEV-PCI',
        },
        {
          value: 'production',
          guaranteeClaim,
          res: 'PROD-PCI',
        },
        {
          value: 'development',
          guaranteeClaim: undefined,
          res: 'DEV',
        },
        {
          value: 'staging',
          guaranteeClaim: undefined,
          res: 'DEV',
        },
        {
          value: 'production',
          guaranteeClaim: undefined,
          res: 'PROD',
        },
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
            amountAfterTax: '776.0',
          },
        ],
        guestCounts: [{ type: 'ADT', count: 2 }, { type: 'CHD', count: 1 }],
        effectiveDate: '2020-07-02',
        expireDate: '2020-07-03',
        amountBeforeTax: '640.0',
        amountAfterTax: '776.0',
        currency: 'SEK',
        'offerItems': {
          'HAS54TFEWO-OfferItemID-83': {
            'passengerReferences': '2251290F 94E54927',
          },
          'KPIC3IX1DH-OfferItemID-84': {
            'passengerReferences': '2251290F',
          },
        },
        extraData: {
          'offerId': 'M8RJJL3J8X-OfferID-1',
          'segments': [
            {
              'id': 'HIXRSLG2KS-SEG1',
              'operator': {
                'operatorType': 'airline',
                'iataCode': 'AC',
                'flightNumber': 'AC0134',
              },
              'Departure': {
                'AirportCode': 'YYC',
                'Date': '2020-09-14',
                'Time': '07:00',
              },
              'Arrival': {
                'AirportCode': 'YYZ',
                'Date': '2020-09-14',
                'Time': '12:50',
                'Terminal': {
                  'Name': '1',
                },
              },
              'MarketingCarrier': {
                'AirlineID': 'AC',
                'Name': 'Air Canada',
                'FlightNumber': '134',
                'ResBookDesigCode': 'L',
              },
              'OperatingCarrier': {
                'Disclosures': {
                  'Description': {
                    'Text': 'R43JX9KFlNGatxTgPk4W7tezJWT2Vuj8UnlLUkThnLG/17BjuAKyJRzQOOvKf1zI8ekioOTIFxjLK2Q44/2u8oD0eWQcKaLQSVSp+soTuqMcep+YABFdWqrYvC1N3Gl/5mTFuZAO5Ed6Ja5ZbLy4rw==',
                  },
                },
              },
              'Equipment': {
                'AircraftCode': '7M8',
              },
              'ClassOfService': {
                'Code': 'L',
              },
              'FlightDetail': {
                'FlightDuration': {
                  'Value': '',
                },
                'Stops': {
                  'StopQuantity': '0',
                },
              },
              'origin': {
                'locationType': 'airport',
                'iataCode': 'YYC',
              },
              'destination': {
                'locationType': 'airport',
                'iataCode': 'YYZ',
              },
              'departureTime': '2020-09-14T13:00:00.000Z',
              'arrivalTime': '2020-09-14T16:50:00.000Z',
              'aggregationKey': 'ACAC01342020-09-14T13:00:00.000Z2020-09-14T16:50:00.000Z',
            },
            {
              'id': 'DK5P6ZER15-SEG2',
              'operator': {
                'operatorType': 'airline',
                'iataCode': 'RV',
                'flightNumber': 'AC1544',
              },
              'Departure': {
                'AirportCode': 'YYZ',
                'Date': '2020-09-14',
                'Time': '14:50',
                'Terminal': {
                  'Name': '1',
                },
              },
              'Arrival': {
                'AirportCode': 'YYT',
                'Date': '2020-09-14',
                'Time': '19:19',
              },
              'MarketingCarrier': {
                'AirlineID': 'AC',
                'Name': 'Air Canada',
                'FlightNumber': '1544',
                'ResBookDesigCode': 'L',
              },
              'OperatingCarrier': {
                'Disclosures': {
                  'Description': {
                    'Text': 'R43JX9KFlNGatxTgPk4W7jNn8zCOXqoJDAplC3QvK8JRyNVshs872/HE8VDWF/tNaGtED8EIJYrlpn8XB8pRX6r+QhxHHDS4OduCOeU5xip/veYLBfhQ9w==',
                  },
                },
              },
              'Equipment': {
                'AircraftCode': '321',
              },
              'ClassOfService': {
                'Code': 'L',
              },
              'FlightDetail': {
                'FlightDuration': {
                  'Value': '',
                },
                'Stops': {
                  'StopQuantity': '0',
                },
              },
              'origin': {
                'locationType': 'airport',
                'iataCode': 'YYZ',
              },
              'destination': {
                'locationType': 'airport',
                'iataCode': 'YYT',
              },
              'departureTime': '2020-09-14T18:50:00.000Z',
              'arrivalTime': '2020-09-14T21:49:00.000Z',
              'aggregationKey': 'ACAC15442020-09-14T18:50:00.000Z2020-09-14T21:49:00.000Z',
            },
          ],
          'destinations': [
            {
              'id': 'V1I4BXC0HW-OD1',
              'DepartureCode': 'YYC',
              'ArrivalCode': 'YYT',
              'FlightReferences': 'HIXRSLG2KS-SEG1 DK5P6ZER15-SEG2',
            },
          ],
          'passengers': {
            'ADT': ['2251290F'],
            'CHD': ['94E54927'],
          },
          'mappedPassengers': {
            '2251290F': 'GS6AQGWK16-T1',
            '94E54927': 'V2BNN2YR9L-T3',
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
                'taxes': '2.40',
              },
              'taxes': [],
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
                'taxes': '2.05',
              },
              'taxes': [],
            },
          ],
        },
      };
      const body = {
        'offerId': '11111111-2222-3333-4444-000000000001',
        'guaranteeId': '02a1a7c0-3ff8-4e12-a3ba-65d57e1e9276',
        'passengers': {
          'PAX1': {
            'type': 'ADT',
            'civility': 'MR',
            'lastnames': [
              'Marley',
            ],
            'firstnames': [
              'Bob',
            ],
            'gender': 'Male',
            'birthdate': '1980-03-21T00:00:00Z',
            'contactInformation': [
              '+32123456789',
              'contact@org.co.uk',
            ],
          },
        },
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
            docType,
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
            docType,
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
