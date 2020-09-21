const { validateSearchCriteria } = require('../../../helpers/payload/validators/searchCriteriaValidator');
const { SearchCriteriaFixtures } = require('../../fixtures/testfixtures.test');
const GliderError = require('../../../helpers/error');
const assert = require('chai').assert;


describe('Offers search payload validator', () => {

  it('should successfully pass validation of flight offers search payload', () => {
    let originalPayload = SearchCriteriaFixtures.flightSearchFixtureJFKDFW_OneWay_1ADT;
    let validPayload = validateSearchCriteria(originalPayload);
    assert.deepEqual(validPayload, originalPayload);
  });

  it('should successfully pass validation of hotel offers search payload', () => {
    let originalPayload = SearchCriteriaFixtures.hotelSearchFixturePolygon_2ADT_1INF;
    let validPayload = validateSearchCriteria(originalPayload);
    assert.deepEqual(validPayload, originalPayload);
  });

  it('should successfully pass validation and add default values to payload if they were missing', () => {
    //first check if payload is OK - should be
    let originalPayload = SearchCriteriaFixtures.flightSearchFixtureJFKDFW_OneWay_1ADT;
    let validPayload = validateSearchCriteria(originalPayload);
    assert.deepEqual(validPayload, originalPayload);

    //now we remove 'count' property of passenger
    let originalPayloadWithMissingProperty = Object.assign({}, SearchCriteriaFixtures.flightSearchFixtureJFKDFW_OneWay_1ADT);
    assert.exists(originalPayloadWithMissingProperty.passengers[0].count);
    delete originalPayloadWithMissingProperty.passengers[0].count;            //remove 'count'
    assert.notExists(originalPayloadWithMissingProperty.passengers[0].count);
    let validated = validateSearchCriteria(originalPayloadWithMissingProperty);
    assert.exists(validated.passengers[0].count);   //after validation, returned object should have 'count' property
    assert.equal(1, validated.passengers[0].count);  //and it should have a default value = 1
  });


  it('should throw exception on incorrect payload', () => {
    let originalPayload = { dummy: 'test' };
    assert.throws(() => validateSearchCriteria(originalPayload), GliderError);
  });
});
