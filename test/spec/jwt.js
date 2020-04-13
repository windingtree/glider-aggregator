const { JWK, JWT } = require('jose');
require('dotenv').config();

const { assertFailure } = require('../helpers/assertions');
const { privPem, pubPem } = require('../helpers/constants');
const { createToken } = require('../helpers/create');
const { verifyJWT } = require('../../helpers/jwt');

require('chai').should();

describe('JWT', () => {
  const aud = 'did:orgid:0x71cd1781a3082f33d2521ac8290c9d4b3b3b116e4e8548a4914b71a1f7201da0';
  const iss = 'did:orgid:0x71cd1781a3082f33d2521ac8290c9d4b3b3b116e4e8548a4914b71a1f7201da0';
  const exp = '24 hours';
  let priv = privPem;
  let pub = pubPem;

  describe('Test helpers', () => {

    describe('#createJWT', () => {

      it('should create a valid JWT token signed with secp256k1', async () => {
        const options = {
          priv,
          alg: 'ES256K',
          aud,
          iss,
          fragment: 'secondkey',
          exp
        };

        const jwt = await createToken(options);
        const pubKey = JWK.asKey(
          pub,
          {
            alg: options.alg,
            use: 'sig'
          }
        );
        const token = JWT.verify(
          jwt,
          pubKey,
          {
            typ: 'JWT',
            audience: options.aud,
            clockTolerance: '1 min'
          }
        );

        (token).should.be.an('object');
        (token).should.has.property('iss').to.equal(`${options.iss}#${options.fragment}`);
        (token).should.has.property('aud').to.equal(options.aud);
        (token).should.has.property('exp').to.be.a('number');
      });
    });
  });

  describe('#verifyJWT', () => {
    const secp256k1Options = {
      priv,
      alg: 'ES256K',
      aud,
      iss,
      fragment: 'secondkey',
      exp
    };
    let secp256k1Jwt;

    beforeEach(async () => {
      secp256k1Jwt = await createToken(secp256k1Options);
    });

    it('should fail if wrong authorization method provided', async () => {
      await assertFailure(
        verifyJWT('Unknown', secp256k1Jwt),
        'Unknown authorization method',
        403
      );
    });

    it('should fail if wrong JWT token provided', async () => {
      await assertFailure(
        verifyJWT('Bearer', 'wrong' + secp256k1Jwt),
        'JWT is malformed',
        403
      );
    });

    it('should fail if expired token provided', async () => {
      const token = await createToken(
        Object.assign({}, secp256k1Options, { exp: '0 s' })
      );
      await assertFailure(
        verifyJWT('Bearer', token),
        'JWT has expired',
        403
      );
    });

    it('should fail if token not meant for Glider', async () => {
      const token = await createToken(
        Object.assign({}, secp256k1Options, { aud: 'not:glider' })
      );
      await assertFailure(
        verifyJWT('Bearer', token),
        'JWT recipient is not Glider',
        403
      );
    });

    it('should fail if issuer not provided', async () => {
      const token = await createToken(
        Object.assign({}, secp256k1Options, { iss: '', fragment: '' })
      );
      await assertFailure(
        verifyJWT('Bearer', token),
        'JWT is missing issuing ORG.ID',
        403
      );
    });

    it('should fail if signature not valid', async () => {
      await assertFailure(
        verifyJWT('Bearer', secp256k1Jwt + 'wrong=='),
        'JWT signature verification failed',
        403
      );
    });

    it('should verify token secp256k1', async () => {
      const { aud, iss, exp } = await verifyJWT('Bearer', secp256k1Jwt);
      (iss).should.equal(`${secp256k1Options.iss}#${secp256k1Options.fragment}`);
      (aud).should.equal(secp256k1Options.aud);
      (exp).should.be.a('number');
    });
  });
});
