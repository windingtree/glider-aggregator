const { searchFlight } = require('./searchFlight');
const sinon = require('sinon');
require('chai').should();


//we need to stub 'createHotelProviders' function to return provider implementation that we need to test (revmax or amadeus)
const providerFactory = require('../providers/providerFactory');
const { FlightProvider1A } = require('../providers/flights/amadeus/flightProvider1A');
const amadeusClient = require('../amadeus/amadeusUtils');
const { logRQRS } = require('../log/logRQ');
const { SearchCriteriaFixtures } = require('../../test/fixtures/testfixtures.test');


describe('Resolvers/searchHotel', async () => {
  let selectProviderStub;

  beforeEach(function () {
    //prepare stub for hotel providers factory so that we can instruct it to always return specific implementation of flight provider (e.g. AC or Amadeus)
    selectProviderStub = sinon.stub(providerFactory, 'selectProvider');
  });


  afterEach(function () {
    selectProviderStub.restore();
  });


  describe('#searchFlight with amadeus', () => {

    let amadeusFlightOffersSearchStub;
    beforeEach(function () {
      //in this suite we want to only test amadeus implementation - thus providerFactory should always return HotelProviderRevMax
      selectProviderStub.returns(['AMADEUS']);

      //prepare stubs of amadeus client
      amadeusFlightOffersSearchStub = sinon.stub(amadeusClient, 'flightOffersSearch');
    });
    afterEach(function () {
      selectProviderStub.restore();
      amadeusFlightOffersSearchStub.restore();
    });

    it('should process search response from Amadeus', async () => {
      let flightSearchResponse = require('../../test/mockresponses/flights/amadeus/amadeusSearchRS_2ADT_1CHD_DFWJFK_Return.json');
      amadeusFlightOffersSearchStub.returns(flightSearchResponse);
      //search using rectangle
      console.log(JSON.stringify(SearchCriteriaFixtures.flightSearchFixtureJFKDFW_Return_2ADT_1INF));
      let result = await searchFlight(SearchCriteriaFixtures.flightSearchFixtureJFKDFW_Return_2ADT_1INF);
      logRQRS(result, 'processed response');
      result.should.be.an('object');
      (result).should.have.property('itineraries').to.be.an('object');
      (result).should.have.property('pricePlans').to.be.an('object');
      (result).should.have.property('offers').to.be.an('object');
      (result).should.have.property('passengers').to.be.an('object');

    });

  });

});
