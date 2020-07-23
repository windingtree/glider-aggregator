const { assertFailure } = require('../../helpers/assertions');
const {
  searchHotel
} = require('../../../helpers/resolvers/searchHotel');
const orderCreateWithOffer = require('../../../helpers/resolvers/hotel/orderCreateWithOffer');
const { selectProvider } = require('../../../helpers/resolvers/utils/flightUtils');

require('chai').should();

describe('Helpers/resolvers', () => {

  describe('#selectProvider', () => {
        
    it('should select AirCanada operator for proper orgin and destination', async () => {
      const providers = selectProvider('YEA', 'YYC');
      (providers).should.be.an('array').to.have.length(1);
      // (providers).should.be.an('array').to.have.length(2);
      (providers).should.include('AC');
    });

    it('should fetch an empty array in wrong origin and provided', async () => {
      let providers;
      providers = selectProvider('UNKNOWN', 'UNKNOWN');
      (providers).should.be.an('array').to.have.length(0);
      // (providers).should.be.an('array').to.have.length(1);
    });
  });

  describe('#searchHotel', () => {
    const rectangleRequest = {
      accommodation: {
        location: {
          rectangle: {
            north: '59',
            south: '57',
            west: '11',
            east: '20'
          }
        },
        arrival: '2020-09-02T00:00:00Z',
        departure: '2020-09-03T00:00:00Z'
      },
      passengers: [
        {
          type: 'ADT',
          count: 2
        },
        {
          type: 'CHD',
          count: 1
        }
      ]
    };

    it('should fail if passengers has not been provided in request', async () => {
      await assertFailure(
        searchHotel(Object.assign({}, rectangleRequest, { passengers: undefined })),
        'Missing passenger types',
        400
      );
    });

    it('should fail if unknown location area type has been provided', async () => {
      await assertFailure(
        searchHotel(Object.assign({}, rectangleRequest, { accommodation: {
          location: {
            'unknownType': []
          }
        } })),
        'A location area of type rectangle, circle or polygon is required',
        400
      );
    });

    describe('Tests with empty result', () => {
      before(async () => {
        process.env.TESTING_EMPTY_RESULT = '1';
      });
      after(async () => {
        process.env.TESTING_EMPTY_RESULT = '0';
      });

      it('should fail if no hotels found', async () => {
        await assertFailure(
          searchHotel(rectangleRequest),
          'No Hotels were found with the provided criteria',
          404
        );
      });
    });

    describe('Tests with erevmax errors', () => {
      before(async () => {
        process.env.TESTING_PROVIDER_ERRORS = '1';
      });
      after(async () => {
        process.env.TESTING_PROVIDER_ERRORS = '0';
      });

      it('should fail if errors gets with erevmax response', async () => {
        await assertFailure(
          searchHotel(rectangleRequest),
          'Request Could Not Be Processed At This Moment',
          502
        );
      });
    });

    it('should resolve hotels by rectangle request', async () => {
      const result = await searchHotel(rectangleRequest);
      (result).should.be.an('object').to.have.property('accommodations').to.be.an('object');
      (result).should.to.have.property('pricePlans').to.be.an('object');
      (result).should.to.have.property('offers').to.be.an('object');
      (result).should.to.have.property('passengers').to.be.an('object');
    });
  });

  describe('#orderCreateWithOffer', () => {
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

      it('should fail if errors gets with erevmax response', async () => {
        await assertFailure(
          orderCreateWithOffer(offer, passengers, card),
          '[erevmax:502] Booking creation failed',
          502
        );
      });
    });
    
    it('should create an order', async () => {
      const result = await orderCreateWithOffer(offer, passengers, card);
      (result).should.be.an('object').to.have.property('orderId').to.be.a('string');
      (result).should.to.have.property('order').to.be.an('object');
      (result.order).should.to.have.property('response').to.be.a('string');
      (result.order).should.to.have.property('reservationNumber').to.be.a('string');
      (result.order).should.to.have.property('errors').to.be.an('array').to.have.property('length').to.equal(0);
      (result.order).should.to.have.property('passengers').to.be.a('object').to.deep.equal(passengers);
    });
  });
});
