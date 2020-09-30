const GliderError = require('./error');
require('chai').should();

describe('GliderError', () => {
  const message = 'Error message';
  const status = 404;
  const code = 'KIND_OF_ERROR';

  it('should create a proper error object', async () => {
    const result = new GliderError(
      message,
      status,
      code
    );
    (result).should.an.instanceOf(GliderError)
      .to.have.property('message').to.equal(message);
    (result).should.to.have.property('status').to.equal(status);
    (result).should.to.have.property('code').to.equal(code);
  });
});
