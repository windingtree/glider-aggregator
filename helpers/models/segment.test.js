const assert = require('chai').assert;
const { FlightOperator, Location, Segment } = require('./segment');
describe('segment serialize test', () => {
  it('should correctly stringify', () => {
    let carrierObj = new FlightOperator('airline', 'SN', 'LH', 123);
    let carrierJsonString = JSON.stringify(carrierObj);
    let expectedJsonString = '{"operatorType":"airline","iataCode":"SN","iataCodeM":"LH","flightNumber":123}';
    console.log('Carrier object as a string:', carrierObj);
    console.log('Carrier object stringified:', JSON.stringify(carrierObj));
    assert.equal(carrierJsonString, expectedJsonString);
  });

  it('should deserialize to correct o', () => {
    let jsonString = '{"operatorType":"airline","iataCode":"SN","iataCodeM":"LH","flightNumber":123}';
    let obj = FlightOperator.fromJSON(JSON.parse(jsonString));
    console.log(obj);
    assert.equal(obj.operatorType, 'airline');
    assert.equal(obj.flightNumber, 123);
    assert.equal(obj.maerketingCarrierCode, 'LH');
    assert.equal(obj.operatingCarrierCode, 'SN');
  });
  it('Location toJSON => json', () => {
    let bru = new Location('airport', 'BRU');
    console.log('Location object as a string:', bru);
    console.log('Location object stringified:', JSON.stringify(bru));
  });
  it('Segment', () => {
    let bru = new Location('airport', 'BRU');
    let lhr = new Location('airport', 'LHR');
    let carrierSN = new FlightOperator('airline', 'SN', 'LH', 123);
    let departureDateTime = Date.parse('2020-11-06T12:25:00');
    let arrivalDateTime = Date.parse('2020-11-06T15:10:00');
    let segment = new Segment(bru, lhr, carrierSN, departureDateTime, arrivalDateTime);
    console.log('Segment object as a string:', segment);
    console.log('Segment object stringified:', JSON.stringify(segment));
  });

});
