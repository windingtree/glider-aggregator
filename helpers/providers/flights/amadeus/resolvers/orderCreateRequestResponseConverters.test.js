const { orderCreateResponseProcessor } = require('./orderCreateRequestResponseConverters');
const assert = require('chai').assert;


describe('flights/amadeus/requestResponseConverters', () => {
  describe('#orderCreateResponseProcessor', () => {
    it('should process 1ADT search response correctly', async () => {
      const amadeusResponse = require('../../../../../test/mockresponses/flights/amadeus/amadeusBookingCreateRS_OK.json');
      const actualResponse = await orderCreateResponseProcessor(amadeusResponse.result);
      console.log(JSON.stringify(actualResponse));
      const { order: { price, passengers, contactList } } = actualResponse;

      assert.equal(price.currency, 'EUR');
      assert.equal(price.public, 62.76);
      assert.equal(price.commission, 0);
      assert.equal(price.taxes, 0);

      assert.equal(passengers.length, 1);
      assert.equal(contactList.length, 1);

      let pax1ContactDetails = contactList[0];
      assert.equal(pax1ContactDetails._id_, passengers[0].contactInformation);
      assert.equal(pax1ContactDetails.emails[0].value,'contact@org.co.uk');
      assert.equal(pax1ContactDetails.phones[0].value,'32123456789');

    });

  });
});
