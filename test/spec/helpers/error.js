const GliderError = require('../../../helpers/error');
require('chai').should();

describe('Helpers/error', () => {
  const message = 'Error message';
  const status = 404;

  it('should create a proper error object', async () => {
    const result = new GliderError(
      message,
      status
    );
    (result).should.an.instanceOf(GliderError)
      .to.have.property('message').to.equal(message);
    (result).should.to.have.property('status').to.equal(status);
  });
});
