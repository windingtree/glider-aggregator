const { processFlightSearchResponse } = require('./searchOffersRequestResponseConverters');
const assert = require('chai').assert;

describe('flights/amadeus/requestResponseConverters', () => {
  describe('#processFlightSearchResponse', () => {


    it('should process 2ADT+1CHD RT search response correctly', async () => {
      const amadeusResponse = require('../../../../../test/mockresponses/flights/amadeus/amadeusSearchRS_2ADT1CHD_Return.json');
      const actualResponse = await processFlightSearchResponse(amadeusResponse.result.data);
      let segment = actualResponse.itineraries.segments[0];
      assert.equal(segment.departureTime.toISOString(), '2020-11-03T20:05:00.000Z');
      assert.equal(segment.arrivalTime.toISOString(), '2020-11-03T21:00:00.000Z');
      console.log(`departureTime:${segment.departureTime.toISOString()}, arrivalTime:${segment.arrivalTime.toISOString()}`);
      // console.log(`XXX:${JSON.stringify(segment)}`);

    });
  });
});
