const {
  uniqueObjectsList,
  flatOneDepth,
} = require('./collections');

require('chai').should();

describe('collectionutils', () => {
  describe('#uniqueObjectsList', () => {
    const arrayOfObjects = [
      {
        a: 1,
      },
      {
        a: 2,
      },
      {
        c: 1,
      },
      {
        a: 1,
      },
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
      [3, 4, 5, [6]],
      [7],
      8,
    ];
    const flatArray = [
      1, 2, 3,
      4, 5, [6],
      7, 8,
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


