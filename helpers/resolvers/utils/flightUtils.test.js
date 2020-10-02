const { selectProvider } = require('./flightUtils');
const sinon = require('sinon');
const config = require('../../../config');

require('chai').should();


describe('Resolvers/utils/flightUtils', () => {
  describe('#selectProvider', () => {
    let getFeatureFlagStub;
    before(function () {
      getFeatureFlagStub = sinon.stub(config, 'getFeatureFlag');
    });
    after(function () {
      getFeatureFlagStub.restore();
    });
    it('should select AirCanada and Amadeus providers for proper origin and destination', async () => {
      getFeatureFlagStub.returns(['AMADEUS','AC']); //simulate that AMADEUS and AirCanada providers are enabled
      const providers = selectProvider('YEA', 'YYC');
      (providers).should.be.an('array').to.have.length(2);
      (providers).should.include('AC');
      (providers).should.include('AMADEUS');

    });

    it('should remove AirCanada from allowed providers if it is disabled by feature flag, although proper origin&destination is used', async () => {
      getFeatureFlagStub.returns(['AMADEUS']); //simulate that only AMADEUS is enabled
      const providers = selectProvider('YEA', 'YYC');
      (providers).should.be.an('array').to.have.length(1);
      (providers).should.include('AMADEUS');
    });

    it('should fetch an empty array in wrong origin and provided', async () => {
      let providers;
      providers = selectProvider('UNKNOWN', 'UNKNOWN');
      (providers).should.be.an('array').to.have.length(0);
      // (providers).should.be.an('array').to.have.length(1);
    });
  });
});
