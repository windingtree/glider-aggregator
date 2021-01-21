const { searchFlight } = require('./searchFlight');
const sinon = require('sinon');
require('chai').should();
//we will stub those to fake responses (instead of making calls to provider APIs)
const providerFactory = require('../providers/providerFactory');
const amadeusClient = require('../amadeus/amadeusUtils');
const ndcClientAC = require('../providers/flights/ac/ndcClientAC');
const { logRQRS } = require('../log/logRQ');

describe('Resolvers/searchFlight', async () => {

  let providerFactoryStub;

  beforeEach(function () {
    //prepare stub for flight providers factory so that we can instruct it to always return specific implementation of flight provider (e.g. AC or Amadeus)
    providerFactoryStub = sinon.stub(providerFactory, 'selectProvider');
  });


  afterEach(function () {
    providerFactoryStub.restore();
  });

  describe('#searchFlight with AirCanada', () => {

    let ndcClientStub;
    beforeEach(function () {
      //in this suite we want to only test air canada implementation
      providerFactoryStub.returns(['AC']);

      //prepare stubs of amadeus client
      ndcClientStub = sinon.stub(ndcClientAC, 'flightSearchRQ');
    });
    afterEach(function () {
      providerFactoryStub.restore();
      ndcClientStub.restore();
    });

    it('should process search response from AirCanada correctly', async () => {
      //instruct stub to return response from JSON file
      let flightSearchResponse = require('../../test/mockresponses/flights/ac/acSearchRS_2ADT_1CHD_YYZLHR_Return.json');
      ndcClientStub.returns(flightSearchResponse);
      //load search criteria that we will use
      let searchCriteria = require('../../test/mockresponses/flights/offersSearchRQ_2ADT_1CHD_YYZLHR_Return.json');

      //search
      let actualResults = await searchFlight(searchCriteria);

      //validate response
      assertSearchResults(searchCriteria, actualResults, flightSearchResponse);
    });
  });


  describe('#searchFlight with amadeus', () => {

    let amadeusClientStub;
    beforeEach(function () {
      //in this suite we want to only test amadeus implementation - thus providerFactory should always return HotelProviderRevMax
      providerFactoryStub.returns(['AMADEUS']);

      //prepare stubs of amadeus client
      amadeusClientStub = sinon.stub(amadeusClient, 'flightOffersSearch');
    });
    afterEach(function () {
      providerFactoryStub.restore();
      amadeusClientStub.restore();
    });

    it('should process search response from Amadeus correctly', async () => {
      //instruct stub to return response from JSON file
      let flightSearchResponse = require('../../test/mockresponses/flights/amadeus/amadeusSearchRS_2ADT_1CHD_YYZLHR.json');
      amadeusClientStub.returns(flightSearchResponse);

      //load search criteria that we will use
      let searchCriteria = require('../../test/mockresponses/flights/offersSearchRQ_2ADT_1CHD_YYZLHR_Return.json');

      //search
      let actualResults = await searchFlight(searchCriteria);
      logRQRS(actualResults, 'actual results');
      assertSearchResults(searchCriteria, actualResults, flightSearchResponse);
    });
  });
});

const collectSegments = (combinationId, results) => {
  let segmentIds = results.itineraries.combinations[combinationId];
  let segments = segmentIds.map(segmentId => results.itineraries.segments[segmentId]);
  return segments;
};
const checkIfDuplicateExistsInArray = (array) => {
  return new Set(array).size !== array.length;
};


const assertSearchResults = (searchCriteria, searchResults) => {
  searchResults.should.be.an('object');
  searchResults.should.have.property('itineraries').to.be.an('object');
  searchResults.should.have.property('pricePlans').to.be.an('object');
  searchResults.should.have.property('offers').to.be.an('object');
  searchResults.should.have.property('passengers').to.be.an('object');

  Object.keys(searchResults.offers).forEach(offerId => {
    let offer = searchResults.offers[offerId];
    const { expiration, pricePlansReferences, price } = offer;
    expiration.should.not.be.empty;


    Object.keys(pricePlansReferences).forEach(ref => {
      const pricePlanRef = pricePlansReferences[ref];
      const { flights } = pricePlanRef;
      //validate offer itineraries(flights)

      //offer flights(itineraries) should not be empty
      flights.should.have.length.above(0);
      //there should be no duplicated itinIDs
      checkIfDuplicateExistsInArray(flights).should.be.false;

      //check if flights actually exist and have at least 1 segment
      flights.forEach(flightId => {
        let segments = collectSegments(flightId, searchResults);
        segments.should.not.be.empty;

        segments.forEach(segment=>{
          const { operator, origin, destination, departureTime, arrivalTime } = segment;
          operator.should.be.an('object');
          operator.should.have.property('operatorType').not.empty;
          operator.should.have.property('iataCode').not.empty;
          operator.should.have.property('flightNumber').not.empty;
          origin.should.be.an('object');
          origin.should.have.property('locationType').not.empty;
          origin.should.have.property('iataCode').not.empty;
          destination.should.be.an('object');
          destination.should.have.property('locationType').not.empty;
          destination.should.have.property('iataCode').not.empty;
          console.log(departureTime, typeof departureTime);
          departureTime.should.not.be.empty;
          arrivalTime.should.not.be.empty;
        });

      });

      //validate price plan
      const pricePlan = searchResults.pricePlans[ref];
      pricePlan.should.not.be.empty;
      const { name, amenities, checkedBaggages } = pricePlan;
      name.should.not.be.empty;
      amenities.should.be.an('array').have.length.above(0);
      checkedBaggages.should.be.an('object');
      checkedBaggages.quantity.should.be.at.least(0);
    });

    //check offer expiry date
    expiration.should.not.be.empty;

    //check offer price
    const { currency, public, commission, taxes } = price;
    currency.should.have.lengthOf(3);
    parseFloat(public).should.be.above(0);
    parseFloat(commission).should.be.at.least(0);
    parseFloat(taxes).should.be.at.least(0);
  });
};
