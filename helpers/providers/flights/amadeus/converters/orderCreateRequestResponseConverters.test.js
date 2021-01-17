const { orderCreateResponseProcessor, orderRetrieveResponseConverter } = require('./orderCreateRequestResponseConverters');
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
      assert.equal(pax1ContactDetails.emails[0].value, 'contact@org.co.uk');
      assert.equal(pax1ContactDetails.phones[0].value, '32123456789');

    });

    it('should process 2ADT+1CH+1INF order create response correctly', async () => {
      const amadeusResponse = require('../../../../../test/mockresponses/flights/amadeus/amadeusBookingCreateRS_2ADT1CHD1INF_OK.json');
      const actualResponse = await orderCreateResponseProcessor(amadeusResponse);
      console.log(JSON.stringify(actualResponse));
      const { order: { price, passengers, contactList } } = actualResponse;

      assert.equal(price.currency, 'EUR');
      assert.equal(price.public, 131.49);
      assert.equal(price.commission, 0);
      assert.equal(price.taxes, 0);

      assert.equal(passengers.length, 4);
      assert.equal(contactList.length, 4);

      let pax1ContactDetails = contactList[0];
      assert.equal(pax1ContactDetails._id_, passengers[0].contactInformation);
      assert.equal(pax1ContactDetails.emails[0].value, 'tomasz.kurek@gmail.com');
      assert.equal(pax1ContactDetails.phones[0].value, '48609111825');

      let pax2ContactDetails = contactList[1];
      assert.equal(pax2ContactDetails._id_, passengers[1].contactInformation);
      assert.equal(pax2ContactDetails.emails[0].value, 'tom@simard.io');
      assert.equal(pax2ContactDetails.phones[0].value, '48609111825');

    });


    it('should process 2ADT+1CH+1INF order retrieve response correctly', async () => {
      const amadeusResponse = require('../../../../../test/mockresponses/flights/amadeus/amadeusBookingRetrieveRS_2ADT1CHD1INF_OK.json');
      const actualResponse = await orderRetrieveResponseConverter(amadeusResponse);
      const { order: { price, passengers, contactList } } = actualResponse;

      assert.equal(price.currency, 'EUR');
      assert.equal(price.public, 131.49);
      assert.equal(price.commission, 0);
      assert.equal(price.taxes, 0);

      assert.equal(passengers.length, 4);
      assert.equal(contactList.length, 4);

      let pax1ContactDetails = contactList[0];
      assert.equal(pax1ContactDetails._id_, passengers[0].contactInformation);
      assert.equal(pax1ContactDetails.emails[0].value, 'TOMASZ.KUREK@GMAIL.COM');
      assert.equal(pax1ContactDetails.phones[0].value, '48609111825');

      let pax2ContactDetails = contactList[1];
      assert.equal(pax2ContactDetails._id_, passengers[1].contactInformation);
      // assert.equal(pax2ContactDetails.emails[0].value, 'tom@simard.io');
      // assert.equal(pax2ContactDetails.phones[0].value, '48609111825');

    });
  });
});
