require('chai').should();
const {
  convertObjectToXML,
  getACSystemId
} = require('../../helpers/soapTemplates/utils/xmlUtils');

describe('XML Utils', () => {

  describe('#convertObjectToXML', () => {
    const xml = '<Test id="123456"><tag1>tag1</tag1><tags><tag2 param1="param1" param2="param2">1</tag2><tag2 param1="param1" param2="param2">2</tag2></tags></Test>';

    const obj = {
      Test: {
        '@id': 123456,
        tag1: 'tag1',
        tags: {
          tag2: [
            {
              '@param1': 'param1',
              '@param2': 'param2',
              '@value': 1
            },
            {
              '@param1': 'param1',
              '@param2': 'param2',
              '@value': 2
            }
          ]
        }
      }
    };
        
    it('should convert object to XML', async () => {
      const result = convertObjectToXML(obj).join('');
      (result).should.equal(xml);
    });

    it('should not mutate source object', async () => {
      const objOrig = JSON.stringify(obj);
      convertObjectToXML(obj).join('');
      (JSON.stringify(obj)).should.equal(objOrig);
    });
  });

  describe('#getACSystemId', () => {
    afterEach(async () => {
      process.env.TESTING_ENV = undefined;
    });

    it('should return PROD on production env', async () => {
      process.env.TESTING_ENV = 'production';
      (getACSystemId(true)).should.to.equal('PROD-PCI');
      (getACSystemId(false)).should.to.equal('PROD');
    });

    it('should return DEV on development or staging env', async () => {
      process.env.TESTING_ENV = 'development';
      (getACSystemId(true)).should.to.equal('DEV-PCI');
      (getACSystemId(false)).should.to.equal('DEV');
      process.env.TESTING_ENV = 'staging';
      (getACSystemId(true)).should.to.equal('DEV-PCI');
      (getACSystemId(false)).should.to.equal('DEV');
    });
  });
});
