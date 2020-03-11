const JWT = require('jsonwebtoken');
const { curves, ec, eddsa } = require('elliptic');
const hash = require('hash.js');
const KeyEncoder = require('key-encoder').default;
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
  let priv = privPem;
  let pub = pubPem;
  let secp256k1Context;
  let secp256k1KeyEncoder;

  before(async () => {
    secp256k1Context = new ec({
      curve: curves.secp256k1,
      hash: hash.sha256
    });
    secp256k1KeyEncoder = new KeyEncoder({
      privatePEMOptions: { label: 'PRIVATE KEY' },
      publicPEMOptions: { label: 'PUBLIC KEY' },
      curve: secp256k1Context
    });
  });


  describe('Test helpers', () => {

    describe('Given key pair', () => {

      it('should be a valid secp256k1 key pair', async () => {
        const rawPub = secp256k1KeyEncoder.encodePublic(pubPem, 'pem', 'raw');
        const keystore = secp256k1Context.keyPair({
          priv: privPem,
          pub: rawPub,
          privEnc: 'hex',
          pubEnc: 'hex'
        });
        (keystore.validate().result).should.be.true;
      });
    });

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

        const pair = secp256k1Context.genKeyPair();
        priv = pair.getPrivate('hex');
        pub = pair.getPublic();

        const jwt = await createJWT(priv, options);

        const decodedToken = JWT.decode(jwt, {
          complete: true
        });
        const lastPeriod = jwt.lastIndexOf('.');
        const jwtMessage = jwt.substring(0, lastPeriod);

        (decodedToken).should.be.an('object');
        (decodedToken).should.has.property('header').to.be.an('object');
        (decodedToken).should.has.property('payload').to.be.an('object');
        (decodedToken.header).should.has.property('typ').to.equal('JWT');
        (decodedToken.header).should.has.property('alg').to.equal(options.alg);
        (decodedToken.payload).should.has.property('iss').to.equal(`${options.iss}#${options.fragment}`);
        (decodedToken.payload).should.has.property('aud').to.equal(options.aud);
        (decodedToken.payload).should.has.property('exp').to.be.a('number');
        (decodedToken.payload).should.has.property('scope').to.equal('');
        (decodedToken.signature).should.be.a('string');

        let rawSign = decodedToken.signature
          .toString()
          .replace('-', '+')
          .replace('_', '/');

        switch (rawSign.length % 4) {
          case 2:
            rawSign += '==';
            break;
          case 3:
            rawSign += '=';
            break;
          case 1:
            throw new Error('Illegal base64url string in JWT Token');
          default:
        }

        const signatureB16 = Buffer
          .from(
            rawSign,
            'base64'
          )
          .toString('hex');
        
        const rawPub = typeof pub === 'string'
          ? secp256k1KeyEncoder.encodePublic(pub, 'pem', 'raw')
          : pub;
        const keystore = secp256k1Context.keyFromPublic(rawPub, 'hex');

        (keystore.validate().result).should.be.true;
        (secp256k1Context.verify(jwtMessage, signatureB16, keystore.getPublic())).should.be.true;
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
      secp256k1Token = await createJWT(privPem, secp256k1);
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
