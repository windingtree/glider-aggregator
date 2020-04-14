require('chai').should();
const { selectProvider } = require('../../helpers/resolvers/utils/flightUtils');

describe('Flight Utils', () => {

  describe('#selectProvider', () => {
        
    it('should select AirCanada oprator for proper orgin and destination', async () => {
      const providers = selectProvider('YEA', 'YYC');
      (providers).should.be.an('array').to.have.length(1);
      (providers).should.include('ac');
    });

    it('should fetch an empty array in wrong origin (and/or) provided', async () => {
      let providers;
      providers = selectProvider('YEA', 'UNKNOWN');
      (providers).should.be.an('array').to.have.length(0);
      providers = selectProvider('UNKNOWN', 'YYC');
      (providers).should.be.an('array').to.have.length(0);
      providers = selectProvider('UNKNOWN', 'UNKNOWN');
      (providers).should.be.an('array').to.have.length(0);
    });
  });
});
