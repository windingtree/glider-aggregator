const GliderError = require('../../error');
const {
  getCardCode,
  cardCodesOTA,
  cardCodesIATA,
} = require('./cardUtils');


require('chai').should();

describe('cardUtils', () => {
  describe('#getCardCode', () => {
    const cardsSet = [
      {
        type: 'ota',
        source: cardCodesOTA,
      },
      {
        type: 'iata',
        source: cardCodesIATA,
      },
    ];

    it('should to throw if wrong card has been provided', async () => {
      cardsSet.forEach(({ type }) => {
        (() => getCardCode({
          brand: undefined,
        }, type)).should.to.throw;
        (() => getCardCode({
          brand: 'UNKNOWN_CARD',
        }, type)).should.to.throw;
        (() => getCardCode({
          brand: [],
        }, type)).should.to.throw;
        (() => getCardCode({
          brand: {},
        }, type)).should.to.throw;
      });
    });

    it('should to throw if wrong type has been provided', async () => {
      cardsSet.forEach(({ source }) => {
        Object.keys(source).forEach(c => {
          (() => getCardCode({
            brand: c,
          }, undefined)).should
            .to.throw(GliderError, 'Missing Card Code type')
            .with.property('status', 500);
          (() => getCardCode({
            brand: c,
          }, 'UNKNOWN_TYPE')).should
            .to.throw(GliderError, 'Missing Card Code type')
            .with.property('status', 500);
        });
      });
    });

    it('should return card codes by type', async () => {
      cardsSet.forEach(({ type, source }) => {
        Object.keys(source).forEach(c => {
          const result = getCardCode({
            brand: c,
          }, type);
          (result).should.to.equal(source[c]);
        });
      });
    });
  });
});


