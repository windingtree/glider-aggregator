const expect = require('chai').expect;
const { ApiToken } = require('./amadeusClient');


describe('#ApiToken', () => {
  it('should consider uninitialized token as expired', () => {
    let token = new ApiToken();
    expect(token.isExpired()).to.be.true;
  });

  it('should correctly process OAuth response', () => {
    let token = new ApiToken();
    let response = {
      'type': 'amadeusOAuth2Token',
      'username': '***hashed***',
      'application_name': '***hashed***',
      'client_id': '***hashed***',
      'token_type': 'Bearer',
      'access_token': '***random_token***',
      'expires_in': 1799,
      'state': 'approved',
      'scope': '',
      'guest_office_id': '',
    };

    expect(token.isExpired()).to.be.true;

    token.processResponse(response);
    expect(token.isExpired()).to.be.false;
    expect(token.getBearerToken()).to.be.equal('***random_token***');

    //check if expiry buffer is taken into account
    //buffer is 30 seconds, so let's see first with 40 seconds expiry - in this case token should still be valid
    response.expires_in = 40;
    token.processResponse(response);
    expect(token.isExpired()).to.be.false;

    //now with 20 seconds - it should be flagged as expired
    response.expires_in = 20;
    token.processResponse(response);
    expect(token.isExpired()).to.be.true;

  });

});

