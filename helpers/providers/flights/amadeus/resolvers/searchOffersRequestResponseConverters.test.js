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


    it('test', () => {
      const response = require('../../../../../test/mockresponses/flights/amadeus/amadeusSearchRS_2ADT1CHD_Return.json');

      //iterate over all segments and load them into a map for later retrieval
      let segmentsMap={};
      response.result.data.map(flightOffer => {
        flightOffer.itineraries.map(itinerary => {
          itinerary.segments.map(segment => {
            segmentsMap[segment.id]=segment;
          });
        });
      });
      console.log(segmentsMap);
    });

  });
});


