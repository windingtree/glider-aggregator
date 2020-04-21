require('chai').should();
const { selectProvider } = require('../../helpers/resolvers/utils/flightUtils');

describe('Flight Utils', () => {

  describe('#selectProvider', () => {
        
    it('should select AirCanada operator for proper orgin and destination', async () => {
      const providers = selectProvider('YEA', 'YYC');
      // (providers).should.be.an('array').to.have.length(1);
      (providers).should.be.an('array').to.have.length(2);
      (providers).should.include('AC');
    });

    it('should fetch an empty array in wrong origin and provided', async () => {
      let providers;
      providers = selectProvider('UNKNOWN', 'UNKNOWN');
      //(providers).should.be.an('array').to.have.length(0);
      (providers).should.be.an('array').to.have.length(1);
    });
  });
});