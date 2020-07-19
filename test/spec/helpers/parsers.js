// const { assertFailure } = require('../../helpers/assertions');
const {
  reduceObjectToProperty,
  splitPropertyBySpace,
  reduceToObjectByKey,
  reduceAccommodation
} = require('../../../helpers/parsers');

require('chai').should();

describe('Helpers/parsers', () => {

  describe('#reduceObjectToProperty', () => {
    const arr = [
      {
        prop: 'prop1'
      },
      {
        prop: 'prop2'
      }
    ];

    it('should trow if wrong array of objects has been provided', async () => {
      (() => reduceObjectToProperty(undefined, 'prop')).should.to.throw;
      (() => reduceObjectToProperty('notAnArray', 'prop')).should.to.throw;
      (() => reduceObjectToProperty([], 'prop')).should.to.throw;
    });

    it('should return undefined properties if unknown property has been provided', async () => {
      const result = reduceObjectToProperty(arr, 'unknownProp');
      arr.forEach((a, index) => {
        (typeof result[String(index)]).should.equal('undefined');
      });
    });

    it('should fulfill', async () => {
      const result = reduceObjectToProperty(arr, 'prop');
      arr.forEach((a, index) => {
        (result[String(index)]).should.equal(a.prop);
      });
    });
  });

  describe('#splitPropertyBySpace', () => {
    const arr = [
      {
        prop: 'prop1 prop2 prop3'
      },
      {
        prop: 'prop4 prop5'
      }
    ];

    it('should trow if wrong array of objects has been provided', async () => {
      (() => splitPropertyBySpace(undefined, 'prop')).should.to.throw;
      (() => splitPropertyBySpace('notAnArray', 'prop')).should.to.throw;
      (() => splitPropertyBySpace([], 'prop')).should.to.throw;
    });

    it('should return undefined properties if unknown property has been provided', async () => {
      (() => splitPropertyBySpace(arr, 'unknownProp')).should.to.throw;
    });

    it('should fulfill', async () => {
      const result = splitPropertyBySpace(arr, 'prop');
      result.forEach((r, i) => {
        (r.prop.length).should.equal(arr[i].prop.split(' ').length);
      });
    });
  });

  describe('#reduceToObjectByKey', () => {
    const arr = [
      {
        _id_: 'prop1',
        data: 1
      },
      {
        _id_: 'prop2',
        data: 2
      }
    ];

    it('should trow if wrong array value has been provided', async () => {
      (() => reduceToObjectByKey(undefined)).should.to.throw;
      (() => reduceToObjectByKey('notAnArray')).should.to.throw;
      (() => reduceToObjectByKey([])).should.to.throw;
    });

    it('should fulfill', async () => {
      const result = reduceToObjectByKey(arr);
      arr.forEach(a => {
        (result[a._id_]).should.be.an('object').to.have.property('data').to.equal(a.data);
      });
    });
  });

  describe('#reduceAccommodation', () => {
    const accommodations = [
      {
        _provider_: 'provider',
        _id_: '07001',
        data: 1
      },
      {
        _provider_: 'provider',
        _id_: '07002',
        data: 2
      }
    ];

    it('should trow if wrong array value has been provided', async () => {
      (() => reduceAccommodation(undefined)).should.to.throw;
      (() => reduceAccommodation('notAnArray')).should.to.throw;
      (() => reduceAccommodation([])).should.to.throw;
    });

    it('should fulfill', async () => {
      const result = reduceAccommodation(accommodations);
      accommodations.forEach(a => {
        (result[`${a._provider_}.${a._id_}`]).should.be.an('object').to.have.property('data').to.equal(a.data);
      });
    });
  });
});
