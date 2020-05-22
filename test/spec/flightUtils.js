require('chai').should();
const { convertObjectToXML } = require('../../helpers/soapTemplates/utils/xmlUtils');

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
});
