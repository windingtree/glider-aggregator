const { searchFlight } = require('./searchFlight');
const sinon = require('sinon');
const { isFuture } = require('date-fns');
require('chai').should();


const providerFactory = require('../providers/providerFactory');
const amadeusClient = require('../amadeus/amadeusUtils');
const ndcClientAC = require('../providers/flights/ac/ndcClientAC');

//we need to stub 'createHotelProviders' function to return provider implementation that we need to test (revmax or amadeus)
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
      let result = await searchFlight(searchCriteria);
      logRQRS(result, 'processed response');
      result.should.be.an('object');
      (result).should.have.property('itineraries').to.be.an('object');
      (result).should.have.property('pricePlans').to.be.an('object');
      (result).should.have.property('offers').to.be.an('object');
      (result).should.have.property('passengers').to.be.an('object');

      //number of offers from provider(amadeus) should be the same as from aggregator
      Object.keys(result.offers).length === flightSearchResponse.data.length;

      Object.keys(result.offers).forEach(offerId => {
        let offer = result.offers[offerId];
        const { expiration, pricePlansReferences, price } = offer;
        expiration.should.not.be.empty;


        Object.keys(pricePlansReferences).forEach(ref => {
          const pricePlanRef = pricePlansReferences[ref];
          const { flights } = pricePlanRef;
          //validate offer itineraries(flights)

          //offer flights(itineraries) should not be empty
          flights.should.have.length.above(0);
          //there should be no duplicated itinIDs
          // checkIfDuplicateExistsInArray(flights).should.be.false;

          //check if flights actually exist and have at least 1 segment
          flights.forEach(flightId => {
            let segments = findSegments(flightId, result);
            segments.should.not.be.empty;
          });

          //validate price plan
          const pricePlan = result.pricePlans[ref];
          pricePlan.should.not.be.empty;
          pricePlan.should.have.property('name').not.empty;
          pricePlan.should.have.property('amenities').to.be.an('array').have.length.above(0);
          pricePlan.should.have.property('checkedBaggages').to.be.an('object');

        });

        //check offer expiry date
        // isFuture(expiration).should.be.true;

        //check offer price
        const { currency, public, commission, taxes } = price;
        currency.should.have.lengthOf(3);
        public.should.be.above(0);
        commission.should.be.at.least(0);
        taxes.should.be.at.least(0);
      });
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
      let result = await searchFlight(searchCriteria);
      logRQRS(result, 'processed response');
      result.should.be.an('object');
      (result).should.have.property('itineraries').to.be.an('object');
      (result).should.have.property('pricePlans').to.be.an('object');
      (result).should.have.property('offers').to.be.an('object');
      (result).should.have.property('passengers').to.be.an('object');

      //number of offers from provider(amadeus) should be the same as from aggregator
      Object.keys(result.offers).length === flightSearchResponse.data.length;

      Object.keys(result.offers).forEach(offerId => {
        let offer = result.offers[offerId];
        const { expiration, pricePlansReferences, price } = offer;
        expiration.should.not.be.empty;


        Object.keys(pricePlansReferences).forEach(ref => {
          const pricePlanRef = pricePlansReferences[ref];
          const { flights } = pricePlanRef;
          //validate offer itineraries(flights)

          //offer flights(itineraries) should not be empty
          flights.should.have.length.above(0);
          //there should be no duplicated itinIDs
          // checkIfDuplicateExistsInArray(flights).should.be.false;

          //check if flights actually exist and have at least 1 segment
          flights.forEach(flightId => {
            let segments = findSegments(flightId, result);
            segments.should.not.be.empty;
          });

          //validate price plan
          const pricePlan = result.pricePlans[ref];
          pricePlan.should.not.be.empty;
          pricePlan.should.have.property('name').not.empty;
          pricePlan.should.have.property('amenities').to.be.an('array').have.length.above(0);
          pricePlan.should.have.property('checkedBaggages').to.be.an('object');

        });

        //check offer expiry date
        // isFuture(expiration).should.be.true;

        //check offer price
        const { currency, public, commission, taxes } = price;
        currency.should.have.lengthOf(3);
        public.should.be.above(0);
        commission.should.be.at.least(0);
        taxes.should.be.at.least(0);
      });
    });
  });
});



const findSegments = (combinationId, results) => {
  let segmentIds = results.itineraries.combinations[combinationId];
  let segments = segmentIds.map(segmentId => results.itineraries.segments[segmentId]);
  return segments;
};
const checkIfDuplicateExistsInArray = (array) => {
  return new Set(array).size !== array.length;
};
