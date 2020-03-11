const JWT = require('jsonwebtoken');
const KeyEncoder = require('key-encoder').default;
const { ec: Ec, eddsa } = require('elliptic');
require('dotenv').config();

const { assertFailure } = require('../helpers/assertions');
const { privPem, pubPem } = require('../helpers/constants');
const { createJWT } = require('../helpers/create');
const { verifyJWT } = require('../../helpers/jwt');

require('chai').should();

describe('JWT', () => {
  const aud = '0x71cd1781a3082f33d2521ac8290c9d4b3b3b116e4e8548a4914b71a1f7201da0';
  const iss = 'did:orgid:0x71cd1781a3082f33d2521ac8290c9d4b3b3b116e4e8548a4914b71a1f7201da0';
  const exp = 7200;

  describe('Test helpers', () => {

    describe('#createJWT', () => {

      it('should create a valid JWT token signed with secp256k1', async () => {
        const options = {
          ctype: 'secp256k1',
          alg: 'DID',
          iss,
          fragment: 'secondkey',
          aud,
          exp
        };

        const { jwt, jwtMessage, key: keyPriv } = await createJWT({
          priv: privPem
        }, options);

        const decodedToken = JWT.decode(jwt, {
          complete: true
        });

        (decodedToken).should.be.an('object');
        (decodedToken).should.has.property('header').to.be.an('object');
        (decodedToken).should.has.property('payload').to.be.an('object');
        (decodedToken.header).should.has.property('typ').to.equal('JWT');
        (decodedToken.header).should.has.property('alg').to.equal(options.alg);
        (decodedToken.payload).should.has.property('iss').to.equal(`${options.iss}#${options.fragment}`);
        (decodedToken.payload).should.has.property('aud').to.equal(options.aud);
        (decodedToken.payload).should.has.property('exp').to.be.a('number');
        (decodedToken.payload).should.has.property('scope').to.equal('');

        const signatureB16 = Buffer.from(
          decodedToken.signature
            .toString()
            .replace('-', '+')
            .replace('_', '/'),
          'base64').toString('hex');

        (keyPriv.verify(jwtMessage, signatureB16)).should.be.true;
      });
    });
  });

  describe('#verifyJWT', () => {
    const secp256k1 = {
      ctype: 'secp256k1',
      alg: 'DID',
      iss,
      fragment: 'secondkey',
      aud,
      exp
    };
    let secp256k1Token;

    beforeEach(async () => {
      const token = await createJWT({ priv: privPem }, secp256k1);
      secp256k1Token = token.jwt;
    });

    it('should verify token secp256k1', async () => {
      const { header, payload } = await verifyJWT('Bearer', secp256k1Token);
      (header).should.to.be.an('object');
      (payload).should.to.be.an('object');
      (header).should.has.property('typ').to.equal('JWT');
      (header).should.has.property('alg').to.equal(secp256k1.alg);
      (payload).should.has.property('iss').to.equal(`${secp256k1.iss}#${secp256k1.fragment}`);
      (payload).should.has.property('aud').to.equal(secp256k1.aud);
      (payload).should.has.property('exp').to.be.a('number');
      (payload).should.has.property('scope').to.equal('');
    });
  });
});
