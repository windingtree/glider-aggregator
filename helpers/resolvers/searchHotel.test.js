const { assertFailure } = require('../../test/helpers/assertions');
const { SearchCriteriaFixtures } = require('../../test/fixtures/testfixtures.test');
const { searchHotel } = require('./searchHotel');
require('chai').should();

const sinon = require('sinon');


//we need to stub 'createHotelProviders' function to return provider implementation that we need to test (revmax or amadeus)
const providerFactory = require('../providers/providerFactory');

//we need to mock revmax and amadeus clients so that it returns mocked responses (/test/mockresponses folder) instead of calling actual API
const revmaxclient = require('../providers/hotels/erevmax/revmaxClient');
const amadeusClient = require('../amadeus/amadeusUtils');
const { HotelProviderAmadeus } = require('../providers/hotels/amadeus/hotelProviderAmadeus');
const { HotelProviderRevMax } = require('../providers/hotels/erevmax/hotelProviderRevMax');

//for revmax implementation we need also to stub calls to mongo which return hotels at given location
const { manager: hotelsManager } = require('../models/mongo/hotels');
const offersModel = require('../models/offer');


describe('Resolvers/searchHotel', async () => {
  let createHotelProvidersStub;
  let storeOffersStub;

  beforeEach(function () {
    //prepare stub of hotel providers factory so that we can instruct it to always return specific implementation of hotel provider (e.g. revmax or amadeus)
    createHotelProvidersStub = sinon.stub(providerFactory, 'createHotelProviders');

    //we need to stub mongo model - to fake call to 'storeOffers' - no need to call mongo from unit tests
    storeOffersStub = sinon.stub(offersModel.offerManager, 'storeOffers');
    storeOffersStub.returns({});
  });


  afterEach(function () {
    createHotelProvidersStub.restore();
    storeOffersStub.restore();
  });

  describe('#searchHotel with revmax', () => {
    let erevmaxHotelSearchStub;
    let hotelsManagerSearchByLocationStub;
    let hotelsManagersearchWithinStub;
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

      //in this suite we want to only test revmax implementation - thus providerFactory should always return HotelProviderRevMax
      createHotelProvidersStub.returns([new HotelProviderRevMax()]);

    });
    afterEach(function () {
      erevmaxHotelSearchStub.restore();
      hotelsManagerSearchByLocationStub.restore();
      hotelsManagersearchWithinStub.restore();
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
    beforeEach(function () {
      //prepare stubs of revmaxclient
      amadeusHotelSearchStub = sinon.stub(amadeusClient, 'hotelSearch');

      //in this suite  we need to make sure always revmax implementation is created by factory
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
