const { assertFailure } = require('../../test/helpers/assertions');
const { SearchCriteriaFixtures } = require('../../test/fixtures/testfixtures.test');
const { searchHotel } = require('./searchHotel');
require('chai').should();

const sinon = require('sinon');


//we need to stub 'createHotelProviders' function to return provider implementation that we need
const providerFactory = require('../providers/providerFactory');

//we need to mock revmax and amadeus clients so that it returns mocked responses (/test/mockresponses folder)
const revmaxclient = require('../providers/hotels/erevmax/revmaxClient');
const amadeusClient = require('../amadeus/amadeusUtils');
const { HotelProviderAmadeus } = require('../providers/hotels/amadeus/hotelProviderAmadeus');
const { HotelProviderRevMax } = require('../providers/hotels/erevmax/hotelProviderRevMax');

//for revmax implementation we need also to stub calls to mongo which return hotels at given location
const { manager: hotelsManager } = require('../models/mongo/hotels');


describe('Resolvers/searchHotel', async () => {

  describe('#searchHotel with revmax', () => {
    let erevmaxHotelSearchStub;
    let hotelsManagerSearchByLocationStub;
    let hotelsManagersearchWithinStub;
    let createHotelProvidersStub;

    beforeEach(function () {
      //prepare stubs of revmaxclient
      erevmaxHotelSearchStub = sinon.stub(revmaxclient, 'erevmaxHotelSearch');
      //and mongo
      hotelsManagerSearchByLocationStub = sinon.stub(hotelsManager, 'searchByLocation');
      hotelsManagersearchWithinStub = sinon.stub(hotelsManager, 'searchWithin');
      //stub hotelsManager to return one hotel - it's needed to make a call to revmax API
      let hotels = {
        'records': [{ 'ref': '08801' }],
      };
      hotelsManagerSearchByLocationStub.returns(Promise.resolve(hotels));
      hotelsManagersearchWithinStub.returns(Promise.resolve(hotels));

      //now we need to make sure always revmax implementation is created by factory
      createHotelProvidersStub = sinon.stub(providerFactory, 'createHotelProviders');
      createHotelProvidersStub.returns([new HotelProviderRevMax()]);


    });
    afterEach(function () {
      erevmaxHotelSearchStub.restore();
      hotelsManagerSearchByLocationStub.restore();
      hotelsManagersearchWithinStub.restore();
      createHotelProvidersStub.restore();
    });

    it('should correctly process correct revmax response and return results', async () => {
      //stub revmaxclient to return mocked response (valid response from revmax with correct search results)
      let revmaxSearchResponseOK = require('../../test/mockresponses/hotels/revmax/revmaxAvailabilityRS_OK.json');
      erevmaxHotelSearchStub.returns(Promise.resolve(revmaxSearchResponseOK));

      //search using rectangle
      let result = await searchHotel(SearchCriteriaFixtures.hotelSearchFixtureRectangle_1ADT);

      (result).should.be.an('object').to.have.property('accommodations').to.be.an('object');
      (result).should.to.have.property('pricePlans').to.be.an('object');
      (result).should.to.have.property('offers').to.be.an('object');
      (result).should.to.have.property('passengers').to.be.an('object');

      //search using circle
      result = await searchHotel(SearchCriteriaFixtures.hotelSearchFixturePolygon_2ADT);
      (result).should.be.an('object').to.have.property('accommodations').to.be.an('object');

      //search using polygon
      result = await searchHotel(SearchCriteriaFixtures.hotelSearchFixturePolygon_2ADT);
      (result).should.be.an('object').to.have.property('accommodations').to.be.an('object');

      //search using invalid request
      let invalidCriteria = JSON.parse(JSON.stringify(SearchCriteriaFixtures.hotelSearchFixturePolygon_2ADT));
      delete invalidCriteria.accommodation.location.polygon;  //remove polygon to make request invalid

      await assertFailure(
        searchHotel(invalidCriteria),
        'A location area of type rectangle, circle or polygon is required', 502);

    });

    it('recognize error returned from revmax API and pass this error as a response', async () => {
      //stub revmaxclient to return mocked response (response from revmax with error message)
      let revmaxSearchResponseOK = require('../../test/mockresponses/hotels/revmax/revmaxAvailabilityRS_Error_InvalidStartDate.json');
      erevmaxHotelSearchStub.returns(Promise.resolve(revmaxSearchResponseOK));
      await assertFailure(
        searchHotel(SearchCriteriaFixtures.hotelSearchFixtureRectangle_1ADT),
        'Provider [revmax]: Invalid Start Date. Start Date Must Not Be Before Date', 502);
    });

    it('should correctly process case where there are no hotels at a given location', async () => {
      //stub hotelsManager to return empty hotels - to simulate case where there are no hotels at given location
      let hotels = {
        'records': [],
      };
      hotelsManagerSearchByLocationStub.returns(Promise.resolve(hotels));
      hotelsManagersearchWithinStub.returns(Promise.resolve(hotels));

      await assertFailure(
        searchHotel(SearchCriteriaFixtures.hotelSearchFixtureRectangle_1ADT),
        'Provider [revmax]: No matching hotels', 502);
    });

  });

  describe('#searchHotel with amadeus', () => {
    let amadeusHotelSearchStub;
    let createHotelProvidersStub;
    beforeEach(function () {
      //prepare stubs of revmaxclient
      amadeusHotelSearchStub = sinon.stub(amadeusClient, 'hotelSearch');

      //now we need to make sure always revmax implementation is created by factory
      createHotelProvidersStub = sinon.stub(providerFactory, 'createHotelProviders');
      createHotelProvidersStub.returns([new HotelProviderAmadeus()]);

    });
    afterEach(function () {
      amadeusHotelSearchStub.restore();
      createHotelProvidersStub.restore();
    });

    it('should correctly process correct amadeus response and return results', async () => {
      //stub amadeus client to return mocked response (valid response with correct search results)
      let amadeusSearchResponseOK = require('../../test/mockresponses/hotels/amadeus/amadeusHotelsSearchRS_OK.json');
      amadeusHotelSearchStub.returns(Promise.resolve(amadeusSearchResponseOK));

      //search using rectangle
      let result = await searchHotel(SearchCriteriaFixtures.hotelSearchFixtureRectangle_1ADT);

      (result).should.be.an('object').to.have.property('accommodations').to.be.an('object');
      (result).should.to.have.property('pricePlans').to.be.an('object');
      (result).should.to.have.property('offers').to.be.an('object');
      (result).should.to.have.property('passengers').to.be.an('object');

      //search using circle
      result = await searchHotel(SearchCriteriaFixtures.hotelSearchFixturePolygon_2ADT);
      (result).should.be.an('object').to.have.property('accommodations').to.be.an('object');

      //search using polygon
      result = await searchHotel(SearchCriteriaFixtures.hotelSearchFixturePolygon_2ADT);
      (result).should.be.an('object').to.have.property('accommodations').to.be.an('object');

      //search using invalid request
      let invalidCriteria = Object.assign(SearchCriteriaFixtures.hotelSearchFixturePolygon_2ADT);
      delete invalidCriteria.accommodation.location.polygon;  //remove polygon to make request invalid

      await assertFailure(
        searchHotel(invalidCriteria),
        'A location area of type rectangle, circle or polygon is required', 502);

    });

    /*it('recognize error returned from Amadeus API and pass this error as a response', async () => {
      //stub revmaxclient to return mocked response (response from revmax with error message)
      let amadeusSearchResponseWithError = require('../../test/mockresponses/hotels/amadeus/amadeusHotelSearchRS_Error_InvalidDate.json');
      amadeusHotelSearchStub.returns(Promise.resolve(amadeusSearchResponseWithError));
    // let r=await searchHotel(SearchCriteriaFixtures.hotelSearchFixtureRectangle_1ADT);
    // console.log(r)
      await assertFailure(
        searchHotel(SearchCriteriaFixtures.hotelSearchFixtureRectangle_1ADT),
        'Provider [revmax]: Invalid Start Date. Start Date Must Not Be Before Date', 502);
    });*/

    /*it('recognize error returned from revmax API and pass this error as a response', async () => {
      //stub revmaxclient to return mocked response (response from revmax with error message)
      let amadeusSearchResponseOK_WithoutResults = require('../../test/mockresponses/hotels/amadeus/amadeusHotelSearchRS_OK_NoResults.json');
      amadeusHotelSearchStub.returns(Promise.resolve(amadeusSearchResponseOK_WithoutResults));

      await assertFailure(
        searchHotel(SearchCriteriaFixtures.hotelSearchFixtureRectangle_1ADT),
        'Provider [revmax]: Invalid Start Date. Start Date Must Not Be Before Date', 502);
    });*/

  });



});
