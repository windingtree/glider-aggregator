const { orderCreateResponseProcessor } = require('./orderCreateRequestResponseConverters');
const assert = require('chai').assert;


describe('flights/amadeus/requestResponseConverters', () => {
  describe('#orderCreateResponseProcessor', () => {
    it('should process 2ADT+1CHD RT search response correctly', async () => {
      const amadeusResponse = require('../../../../../test/mockresponses/flights/amadeus/amadeusBookingCreateRS_OK.json');
      const actualResponse = await orderCreateResponseProcessor(amadeusResponse.result);
      console.log(JSON.stringify(actualResponse));
      const { order: { price, passengers } } = actualResponse;

      assert.equal(price.currency, 'EUR');
      assert.equal(price.public, 62.76);
      assert.equal(price.commission, 0);
      assert.equal(price.taxes, 0);

      assert.equal(Object.keys(passengers).length, 1);
      assert.equal(Object.keys(passengers).length, 1);


    });

  });
});
