const { selectProvider } = require('./flightUtils');

require('chai').should();

describe('Resolvers/utils/flightUtils', () => {

  describe('#selectProvider', () => {

    it('should select AirCanada operator for proper orgin and destination', async () => {
      const providers = selectProvider('YEA', 'YYC');
      (providers).should.be.an('array').to.have.length(2);
      // (providers).should.be.an('array').to.have.length(2);
      (providers).should.include('AC');
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
