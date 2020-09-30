const { assertFailure } = require('../../../test/helpers/assertions');
const orderCreateWithOffer = require('./orderCreateWithOffer');
const sinon = require('sinon');

const revmaxclient = require('../../providers/hotels/erevmax/revmaxClient');

require('chai').should();

describe('Resolvers/hotel', () => {
  describe('#orderCreateWithOffer', () => {
    const offer = {
      provider: 'revmax',
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
    const card = {
      accountNumber: '4444333322221111',
      brand: 'visa',
      cvv: '737',
      expiryMonth: '10',
      expiryYear: '2020',
      id: 'e6266e16-eb45-4781-9788-271553dc6657',
      type: 'debit'
    };

    describe('Tests with erevmax errors', () => {
      before(async () => {
        process.env.TESTING_PROVIDER_ERRORS = '1';
      });
      after(async () => {
        process.env.TESTING_PROVIDER_ERRORS = '0';
      });

      let erevmaxHotelBookStub;

      beforeEach(function () {
        erevmaxHotelBookStub = sinon.stub(revmaxclient, 'erevmaxHotelBook');
      });
      afterEach(function () {
        erevmaxHotelBookStub.restore();
      });
      it('should fail if errors gets with erevmax response', async () => {
        let erevmaxHotelBookErrorResponse = require('../../../test/mocks/erevmaxErrors.json');
        erevmaxHotelBookStub.returns(Promise.resolve(erevmaxHotelBookErrorResponse));
        await assertFailure(
          orderCreateWithOffer(offer, passengers, card),
          'Request Could Not Be Processed At This Moment',
          502
        );
      });
    });

    /* Temporarily disable
    it('should create an order', async () => {
      const result = await orderCreateWithOffer(offer, passengers, card);
      (result).should.be.an('object').to.have.property('orderId').to.be.a('string');
      (result).should.to.have.property('order').to.be.an('object');
      (result.order).should.to.have.property('response').to.be.a('string');
      (result.order).should.to.have.property('reservationNumber').to.be.a('string');
      // (result.order).should.to.have.property('errors').to.be.an('array').to.have.property('length').to.equal(0);
      (result.order).should.to.have.property('passengers').to.be.a('object').to.deep.equal(passengers);
    });*/
  });
});
