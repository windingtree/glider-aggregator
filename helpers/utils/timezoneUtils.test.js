const { zonedTimeToUtc } = require('date-fns-tz');
const assert = require('chai').assert;
const { convertLocalAirportTimeToUtc, convertDateToAirportTime } = require('./timezoneUtils');
const { airports } = require('./timeZoneByAirportCode');
require('chai').should();

describe('utils/timezoneUtils', () => {
  describe('#convertLocalAirportTimeToUtc', () => {
    it('should convert local airport time to UTC', () => {
      let yvrLocal = '2020-10-14T13:45:00';
      let yvrUtc = convertLocalAirportTimeToUtc(yvrLocal, 'YVR');
      assert.equal(yvrUtc.toISOString(), '2020-10-14T20:45:00.000Z');
      console.log(`local YVR=>${yvrLocal}, UTC=>${yvrUtc.toISOString()}`);
      let nrtLocal = '2020-10-15T16:30:00';
      let nrtUtc = convertLocalAirportTimeToUtc(nrtLocal, 'NRT');
      console.log(`local NRT=>${nrtLocal}, UTC=>${nrtUtc.toISOString()}`);
      assert.equal(nrtUtc.toISOString(), '2020-10-15T07:30:00.000Z');
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
        airports[iataCode],
      ).toISOString();
      (result.toISOString()).should.to.equal(airportTime);
    });
  });

});
