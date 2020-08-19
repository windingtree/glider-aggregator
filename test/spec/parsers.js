// const { assertFailure } = require('../../helpers/assertions');
const { zonedTimeToUtc } = require('date-fns-tz');
const { airports } = require('../../helpers/parsers/timeZoneByAirportCode');
const {
  reduceObjectToProperty,
  splitPropertyBySpace,
  reduceToObjectByKey,
  reduceAccommodation,
  reduceContactInformation,
  useDictionary,
  mergeHourAndDate,
  convertDateToAirportTime,
  reduceToProperty,
  roundCommissionDecimals,
  deepMerge
} = require('../../helpers/parsers');

require('chai').should();

describe('Helpers/parsers', () => {

  describe('#reduceObjectToProperty', () => {
    const arr = [
      {
        prop: 'prop1'
      },
      {
        prop: 'prop2'
      }
    ];

    it('should trow if wrong array of objects has been provided', async () => {
      (() => reduceObjectToProperty(undefined, 'prop')).should.to.throw;
      (() => reduceObjectToProperty('notAnArray', 'prop')).should.to.throw;
      (() => reduceObjectToProperty([], 'prop')).should.to.throw;
    });

    it('should return undefined properties if unknown property has been provided', async () => {
      const result = reduceObjectToProperty(arr, 'unknownProp');
      arr.forEach((a, index) => {
        (typeof result[String(index)]).should.equal('undefined');
      });
    });

    it('should fulfill', async () => {
      const result = reduceObjectToProperty(arr, 'prop');
      arr.forEach((a, index) => {
        (result[String(index)]).should.equal(a.prop);
      });
    });
  });

  describe('#splitPropertyBySpace', () => {
    const arr = [
      {
        prop: 'prop1 prop2 prop3'
      },
      {
        prop: 'prop4 prop5'
      }
    ];

    it('should trow if wrong array of objects has been provided', async () => {
      (() => splitPropertyBySpace(undefined, 'prop')).should.to.throw;
      (() => splitPropertyBySpace('notAnArray', 'prop')).should.to.throw;
      (() => splitPropertyBySpace([], 'prop')).should.to.throw;
    });

    it('should return undefined properties if unknown property has been provided', async () => {
      (() => splitPropertyBySpace(arr, 'unknownProp')).should.to.throw;
    });

    it('should fulfill', async () => {
      const result = splitPropertyBySpace(arr, 'prop');
      result.forEach((r, i) => {
        (r.prop.length).should.equal(arr[i].prop.split(' ').length);
      });
    });
  });

  describe('#reduceToObjectByKey', () => {
    const arr = [
      {
        _id_: 'prop1',
        data: 1
      },
      {
        _id_: 'prop2',
        data: 2
      }
    ];

    it('should trow if wrong array value has been provided', async () => {
      (() => reduceToObjectByKey(undefined)).should.to.throw;
      (() => reduceToObjectByKey('notAnArray')).should.to.throw;
      (() => reduceToObjectByKey([])).should.to.throw;
    });

    it('should fulfill', async () => {
      const result = reduceToObjectByKey(arr);
      arr.forEach(a => {
        (result[a._id_]).should.be.an('object').to.have.property('data').to.equal(a.data);
      });
    });
  });

  describe('#reduceAccommodation', () => {
    const accommodations = [
      {
        _provider_: 'provider',
        _id_: '07001',
        data: 1
      },
      {
        _provider_: 'provider',
        _id_: '07002',
        data: 2
      }
    ];

    it('should trow if wrong array value has been provided', async () => {
      (() => reduceAccommodation(undefined)).should.to.throw;
      (() => reduceAccommodation('notAnArray')).should.to.throw;
      (() => reduceAccommodation([])).should.to.throw;
    });

    it('should fulfill', async () => {
      const result = reduceAccommodation(accommodations);
      accommodations.forEach(a => {
        (result[`${a._provider_}.${a._id_}`]).should.be.an('object').to.have.property('data').to.equal(a.data);
      });
    });
  });

  describe('#reduceContactInformation', () => {
    const passengers = [
      {
        _id_: 'TravelerRefNumber2',
        type: 'ADT',
        gender: 'Male',
        civility: 'MR',
        lastnames: [
          'MARLEY'
        ],
        firstnames: [
          'BOB'
        ],
        birthdate: '1980-03-21',
        contactInformation: {
          emails: [
            {
              value: 'CONTACT@ORG.CO.UK'
            }
          ],
          phones: [
            {
              value: '+32123456789'
            }
          ]
        }
      }
    ];

    it('should throw of wrong passengers has been provided', async () => {
      (() => reduceContactInformation(undefined)).should.to.throw;
      (() => reduceContactInformation('notAnArray')).should.to.throw;
      (() => reduceContactInformation({})).should.to.throw;
    });

    it('should reduce contact information', async () => {
      const result = reduceContactInformation(passengers);
      (result).should.be.an('array');
      result.forEach(t => {
        (t).should.be.an('object');
        (t).should.to.have.property('_id_').to.be.a('string');
        (t).should.to.have.property('type').to.be.a('string');
        (t).should.to.have.property('gender').to.be.a('string');
        (t).should.to.have.property('civility').to.be.a('string');
        (t).should.to.have.property('lastnames').to.be.an('array');
        (t).should.to.have.property('firstnames').to.be.an('array');
        (t).should.to.have.property('birthdate').to.be.a('string');
        (t).should.to.have.property('contactInformation').to.be.an('array');
      });
    });
  });

  describe('#useDictionary', () => {
    const passengers = [
      {
        _id_: 'TravelerRefNumber2',
        contactInformation: 'CONTACT_For_TravelerRefNumber2'
      }
    ];
    const contacList = {
      'CONTACT_For_TravelerRefNumber2': {
        emails: [
          {
            value: 'CONTACT@ORG.CO.UK'
          }
        ]
      }
    };
    const word = 'contactInformation';

    it('should to trow if wrong array has been provided', async () => {
      (() => useDictionary(undefined, contacList, word)).should.to.throw;
      (() => useDictionary('wrongType', contacList, word)).should.to.throw;
      (() => useDictionary({}, contacList, word)).should.to.throw;
    });

    it('should to trow if wrong dictionary has been provided', async () => {
      (() => useDictionary(passengers, undefined, word)).should.to.throw;
      (() => useDictionary(passengers, 'wrongType', word)).should.to.throw;
      (() => useDictionary(passengers, {}, word)).should.to.throw;
    });

    it('should to trow if undefined word has been provided', async () => {
      (() => useDictionary(passengers, contacList, undefined)).should.to.throw;
    });

    it('should produce broken array if unknown word has been provided', async () => {
      const word = 'unknownWord';
      const result = useDictionary(passengers, contacList, word);
      (result).should.be.an('array');
      result.forEach(t => {
        (t).should.to.have.property(word).to.equal(undefined);
      });
    });

    it('should transform array with dictionary', async () => {
      const result = useDictionary(passengers, contacList, word);
      (result).should.be.an('array');
      result.forEach((t, i) => {
        (t).should.to.have.property('_id_').to.equal(passengers[i]._id_);
        (t).should.to.have.property('contactInformation')
          .to.deep.equal(contacList[passengers[i][word]]);
      });
    });
  });

  describe('#mergeHourAndDate', () => {
    const segments = [
      {
        '_id_': 'HWYTY2RNMT-SEG291',
        'operator': {
          'operatorType': 'airline',
          'iataCode': '',
          'iataCodeM': 'AC',
          'flightNumber': '164'
        },
        'origin': {
          'locationType': 'airport',
          'iataCode': 'YEG'
        },
        'destination': {
          'locationType': 'airport',
          'iataCode': 'YYZ'
        },
        'splittedDepartureTime': '09:00',
        'splittedDepartureDate': '2020-09-14',
        'splittedArrivalTime': '14:35',
        'splittedArrivalDate': '2020-09-14',
        'Departure': {
          'AirportCode': 'YEG',
          'Date': '2020-09-14',
          'Time': '09:00',
          'Terminal': {
            'Name': ''
          }
        },
        'Arrival': {
          'AirportCode': 'YYZ',
          'Date': '2020-09-14',
          'Time': '14:35',
          'Terminal': {
            'Name': '1'
          }
        },
        'MarketingCarrier': {
          'AirlineID': 'AC',
          'Name': 'Air Canada',
          'FlightNumber': '164',
          'ResBookDesigCode': 'B'
        },
        'OperatingCarrier': {
          'Disclosures': {
            'Description': {
              'Text': 'yfq7H2nszqdvF8SySYd5TV8dpcsYUV67hhsPQkG0KtuMa/AmJRTN4jT+fplmszbFaGtED8EIJYrbScfNk5TdE2NWN/9d2yHWak/vPCpyfdjBFHiM+rPeiQ=='
            }
          }
        },
        'Equipment': {
          'AircraftCode': '321'
        },
        'ClassOfService': {
          'Code': 'B'
        },
        'FlightDetail': {
          'FlightDuration': {
            'Value': 'PT03H35M'
          },
          'Stops': {
            'StopQuantity': '0'
          }
        }
      }
    ];

    it('should to throw if wrong array has been passed', async () => {
      (() => mergeHourAndDate(undefined)).should.to.throw;
      (() => mergeHourAndDate('wrongType')).should.to.throw;
      (() => mergeHourAndDate({})).should.to.throw;
      (() => mergeHourAndDate([])).should.to.throw;
    });

    it('should merge hour and date', async () => {
      const result = mergeHourAndDate(segments);
      (result).should.be.an('array');
      result.forEach((s, i) => {
        const keys = Object.keys(s);
        keys.forEach(k => {
          if (!['departureTime', 'arrivalTime'].includes(k)) {
            (s).should.to.have.property(k).to.deep.equal(segments[i][k]);
          } else if (k === 'departureTime') {
            const time = zonedTimeToUtc(
              `${segments[i].splittedDepartureDate} ${segments[i].splittedDepartureTime}:00.000`,
              airports[s.origin.iataCode]
            ).toISOString();
            (s.departureTime).should.to.equal(time);
          } else if (k === 'arrivalTime') {
            const time = zonedTimeToUtc(
              `${segments[i].splittedArrivalDate} ${segments[i].splittedArrivalTime}:00.000`,
              airports[s.destination.iataCode]
            ).toISOString();
            (s.arrivalTime).should.to.equal(time);
          }
        });
      });
    });
  });

  describe('#convertDateToAirportTime', () => {
    const date = '2020-09-14';
    const time = '14:30';
    const iataCode = 'YYZ';

    it('should to throw if wrong data has been passed', async () => {
      (() => convertDateToAirportTime(undefined, time, iataCode)).should.to.throw;
      (() => convertDateToAirportTime('wrongString', time, iataCode)).should.to.throw;
      (() => convertDateToAirportTime('', time, iataCode)).should.to.throw;
      (() => convertDateToAirportTime([], time, iataCode)).should.to.throw;
      (() => convertDateToAirportTime({}, time, iataCode)).should.to.throw;
    });

    it('should to throw if wrong time has been passed', async () => {
      (() => convertDateToAirportTime(date, undefined, iataCode)).should.to.throw;
      (() => convertDateToAirportTime(date, 'wrongString', iataCode)).should.to.throw;
      (() => convertDateToAirportTime(date, '', iataCode)).should.to.throw;
      (() => convertDateToAirportTime(date, [], iataCode)).should.to.throw;
      (() => convertDateToAirportTime(date, {}, iataCode)).should.to.throw;
    });

    it('should to throw if wrong iataCode has been passed', async () => {
      (() => convertDateToAirportTime(date, time, undefined)).should.to.throw;
      (() => convertDateToAirportTime(date, time, '0000')).should.to.throw;
      (() => convertDateToAirportTime(date, time, '')).should.to.throw;
      (() => convertDateToAirportTime(date, time, [])).should.to.throw;
      (() => convertDateToAirportTime(date, time, {})).should.to.throw;
    });

    it('should covert date', async () => {
      const result = convertDateToAirportTime(date, time, iataCode);
      const airportTime = zonedTimeToUtc(
        `${date} ${time}:00.000`,
        airports[iataCode]
      ).toISOString();
      (result.toISOString()).should.to.equal(airportTime);
    });
  });

  describe('#reduceToProperty', () => {
    const data = {
      one: {
        prop: {
          value: 1
        }
      },
      two: {
        prop: {
          value: 2
        }
      }
    };

    it('should to throw if wrong object has been provided', async () => {
      (() => reduceToProperty(undefined, 'prop')).should.to.throw;
      (() => reduceToProperty('wrongType', 'prop')).should.to.throw;
      (() => reduceToProperty([], 'prop')).should.to.throw;
      (() => reduceToProperty({}, 'prop')).should.to.throw;
    });

    it('should to throw if wrong property has been provided', async () => {
      (() => reduceToProperty(data, undefined)).should.to.throw;
      (() => reduceToProperty(data, [])).should.to.throw;
      (() => reduceToProperty(data, {})).should.to.throw;
    });

    it('should return broken array if unknown property has been provided', async () => {
      const result = reduceToProperty(data, 'unknownProperty');
      result.forEach(a => {
        const prop = Object.keys(a)[0];
        (data).should.to.have.property(prop);
        (typeof a[prop]).should.to.equal('undefined');
      });
    });
    
    it('should fulfill', async () => {
      const result = reduceToProperty(data, 'prop');
      result.forEach(a => {
        const prop = Object.keys(a)[0];
        (data).should.to.have.property(prop);
        (a[prop]).should.to.deep.equal(data[prop].prop);
      });
    });
  });

  describe('#roundCommissionDecimals', () => {
    const offers = [
      {
        '_id_': 'T4B56FYQEH-OfferID-42',
        'offerItems': {
          'HAS54TFEWO-OfferItemID-83': {
            'passengerReferences': '5B628F25 84B3E141'
          },
          'KPIC3IX1DH-OfferItemID-84': {
            'passengerReferences': 'E32E17CB'
          }
        },
        'expiration': '',
        'price': {
          'currency': 'CAD',
          'public': '3666.90',
          'commission': 0,
          'taxes': '135.30'
        },
        'pricePlansReferences': {
          'G9I3YBZWA4-BusinessClassflexible': {
            'flights': [
              'FFCQV2B62M-OD120',
              'GOKZJ5PLMB-OD121'
            ]
          }
        }
      },
      {
        '_id_': 'Q2T85YX2T0-OfferID-43',
        'offerItems': {
          'AQ7HWZ2LXH-OfferItemID-85': {
            'passengerReferences': '5B628F25 84B3E141'
          },
          'Y5OU8TUXKZ-OfferItemID-86': {
            'passengerReferences': 'E32E17CB'
          }
        },
        'expiration': '',
        'price': {
          'currency': 'CAD',
          'public': '3671.49',
          'commission': 0,
          'taxes': '136.83'
        },
        'pricePlansReferences': {
          'G9I3YBZWA4-BusinessClassflexible': {
            'flights': [
              'F7RWILPCNQ-OD122'
            ]
          }
        }
      }
    ];

    it('should to throw if wrong array has been provided', async () => {
      (() => roundCommissionDecimals(undefined)).should.to.throw;
      (() => roundCommissionDecimals('wrongType')).should.to.throw;
      (() => roundCommissionDecimals([])).should.to.throw;
      (() => roundCommissionDecimals({})).should.to.throw;
    });

    it('should round commission decimals in offers', async () => {
      const result = roundCommissionDecimals(offers);
      (result).should.be.an('array');
      result.forEach((o, i) => {
        (o).should.to.have.property('price').to.be.an('object').to.have.property('commission');
        (o.price.commission).should.to.equal(offers[i].price.commission.toFixed(2).toString());
      });
    });
  });

  describe('#deepMerge', () => {
    const obj1 = {
      prop1: {
        value1: 1,
        value2: {
          value3: 3
        }
      },
      prop2: {
        value4: 4
      }
    };
    const obj2 = {
      prop1: {
        value4: 'new4',
        value2: {
          value3: 'new3',
          value5: 5
        }
      },
      prop2: {
        value6: 6
      }
    };

    it('should to throw if wrong object has been provided', async () => {
      (() => deepMerge(undefined, obj2)).should.to.throw;
      (() => deepMerge(obj1, undefined)).should.to.throw;
      (() => deepMerge('obj1', obj2)).should.to.throw;
      (() => deepMerge(obj1, 'obj2')).should.to.throw;
      (() => deepMerge([], obj2)).should.to.throw;
      (() => deepMerge(obj1, [])).should.to.throw;
    });

    it('should create merged object', async () => {
      const result = deepMerge(obj1, obj2);
      (result).should.be.an('object').to.have.property('prop1')
        .to.deep.equal({ value4: 'new4', value2: { value3: 'new3', value5: 5 }, value1: 1 });
      (result).should.property('prop2')
        .to.deep.equal({ value6: 6, value4: 4 });
    });
  });
});
