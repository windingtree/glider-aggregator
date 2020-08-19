const GliderError = require('../../helpers/error');
const {
  getCardCode,
  cardCodesOTA,
  cardCodesIATA
} = require('../../helpers/transformInputData/utils/cardUtils');
const {
  uniqueObjectsList,
  flatOneDepth
} = require('../../helpers/transformInputData/utils/collections');
const {
  mapGuestCounts
} = require('../../helpers/soapTemplates/ota/otaUtils');

require('chai').should();

describe('Utils', () => {

  describe('Helpers/**/utils', () => {

    describe('#getCardCode', () => {
      const cardsSet = [
        {
          type: 'ota',
          source: cardCodesOTA
        },
        {
          type: 'iata',
          source: cardCodesIATA
        }
      ];

      it('should to throw if wrong card has been provided', async () => {
        cardsSet.forEach(({ type }) => {
          (() => getCardCode({
            brand: undefined
          }, type)).should.to.throw;
          (() => getCardCode({
            brand: 'UNKNOWN_CARD'
          }, type)).should.to.throw;
          (() => getCardCode({
            brand: []
          }, type)).should.to.throw;
          (() => getCardCode({
            brand: {}
          }, type)).should.to.throw;
        });
      });

      it('should to throw if wrong type has been provided', async () => {
        cardsSet.forEach(({ source }) => {
          Object.keys(source).forEach(c => {
            (() => getCardCode({
              brand: c
            }, undefined)).should
              .to.throw(GliderError, 'Missing Card Code type')
              .with.property('status', 500);
            (() => getCardCode({
              brand: c
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
              brand: c
            }, type);
            (result).should.to.equal(source[c]);
          });
        });
      });
    });

    describe('#uniqueObjectsList', () => {
      const arrayOfObjects = [
        {
          a: 1
        },
        {
          a: 2
        },
        {
          c: 1
        },
        {
          a: 1
        }
      ];

      it('should to throw if wrong array has been provided', async () => {
        (() => uniqueObjectsList(undefined)).should.to.throw;
        (() => uniqueObjectsList('wrongType')).should.to.throw;
        (() => uniqueObjectsList({})).should.to.throw;
      });

      it('should return unique objects array', async () => {
        const result = uniqueObjectsList(arrayOfObjects);
        const uniquesSet = new Set(result);
        (Array.from(uniquesSet)).should.to.deep.equal(result);
      });
    });

    describe('#flatOneDepth', () => {
      const deepArray = [
        1,
        2,
        [ 3, 4, 5, [ 6 ] ],
        [ 7 ],
        8
      ];
      const flatArray = [
        1, 2, 3,
        4, 5, [ 6 ],
        7, 8
      ];

      it('should to throw if wrong array has been provided', async () => {
        (() => flatOneDepth(undefined)).should.to.throw;
        (() => flatOneDepth('wrongType')).should.to.throw;
        (() => flatOneDepth({})).should.to.throw;
      });

      it('should return flat array', async () => {
        const result = flatOneDepth(deepArray);
        (result).should.to.be.an('array').to.deep.equal(flatArray);
      });
    });
  });

  describe('soapTemplates/ota', () => {

    describe('#mapGuestCounts', () => {
      const OTA_GuestCount = {
        Count: 1,
        AgeQualifyingCode: 10
      };

      it('should map data', async () => {
        const result = mapGuestCounts([
          OTA_GuestCount,
          OTA_GuestCount
        ]);
        (result).should.equal('<GuestCount AgeQualifyingCode="10" Count="1"/><GuestCount AgeQualifyingCode="10" Count="1"/>');
      });
    });
  });
});


