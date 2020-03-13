const { JWK, JWT } = require('jose');
const ethers = require('ethers');
const Web3 = require('web3');
const { OrgIdResolver, httpFetchMethod } = require('@windingtree/org.id-resolver');
const { addresses } = require('@windingtree/org.id');
const redis = require('redis');

const config = require('../config');
const web3 = new Web3(config.INFURA_ENDPOINT);

// ORG.ID resolver configuration
const orgIdResolver = new OrgIdResolver({
  web3,
  orgId: addresses.ropsten // @todo Set the network type on the base of environment config
});
orgIdResolver.registerFetchMethod(httpFetchMethod);

// Redis client configuration
let redisClient;

if (!process.env.TESTING) {
  redisClient = redis.createClient();
  redisClient.on('error', (error) => {
    console.error(error);

    if (error.code === 'ECONNREFUSED') {
      // Fallback to Map
      redisClient = new Map();
      console.log('Fallback to Map instead of Redis');
    }
  });
} else {
  redisClient = new Map();
}

module.exports.verifyJWT = async (type, jwt) => {

  if (type !== 'Bearer') {
    throw new Error('Unknown authorization method');
  };

  const decodedToken = JWT.decode(jwt, {
    complete: true
  });

  const { payload: { exp, aud, iss } } = decodedToken;

  // Token must not be expired
  if (exp < Date.now() / 1000) {
    throw new Error('JWT has expired');
  }

  // Token audience should be a Glider DID
  if (aud !== config.GLIDER_DID) {
    throw new Error('JWT not meant for Glider');
  }

  // Issuer should be defined
  if (!iss || iss === '') {
    throw new Error('JWT is missing issuing ORG.ID');
  }

  // Resolve did to didDocument
  const [ did, fragment ] = iss.split('#');
  
  let didResult;
  const cachedDidResult = redisClient.get(`didResult:${did}`);

  if (cachedDidResult) {
    didResult = cachedDidResult;
  } else {
    didResult = await orgIdResolver.resolve(did);
    redisClient.set(`didResult:${did}`, didResult);
  }

  // Organization should not be disabled
  if (!didResult.organization.state) {
    throw new Error(`The organization: ${didResult.organization.orgId} is disabled`);
  }

  // Lif deposit should be equal or more then configured
  if (Number(web3.utils.fromWei(didResult.lifDeposit.deposit, 'ether')) < process.env.LIF_MIN_DEPOSIT) {
    throw new Error(`Lif token deposit for the organization: ${didResult.organization.orgId} is less then ${process.env.LIF_MIN_DEPOSIT}`);
  }

  if (!fragment) {
    // Validate signature of the organization owner or director

    const lastPeriod = jwt.lastIndexOf('.');
    const jwtMessage = jwt.substring(0, lastPeriod);
    let rawSign = decodedToken.signature
      .toString()
      .replace('-', '+')
      .replace('_', '/');

    const signatureB16 = Buffer
      .from(
        rawSign,
        'base64'
      )
      .toString('hex');
    
    const hashedMessage = ethers.utils.hashMessage(jwtMessage);
    const signingAddress = ethers.utils.recoverAddress(hashedMessage, `0x${signatureB16}`);

    // Signer address should be an owner address or director address
    // and director have to be confirmed
    if (![
      didResult.organization.owner,
      ...(didResult.organization.director !== '0x0000000000000000000000000000000000000000'
          && didResult.organization.directorConfirmed
        ? [didResult.organization.director]
        : [])
    ].includes(signingAddress)) {
      throw new Error('JWT Token is signed by unknown key');
    }

  } else if (fragment && didResult.didDocument.publicKey) {
    // Validate signature using publickKey
    
    let publicKey = didResult.didDocument.publicKey.filter(
      p => p.id.match(RegExp(`#${fragment}$`, 'g'))
    )[0];

    if (!publicKey) {
      throw new Error('Public key definition not found in the DID document');
    }

    let alg;

    switch (publicKey.type) {
      case 'X25519':
        throw new Error('X25519 not supported yet');
  
      case 'ES256K':
      case 'secp256k1':
        alg = 'ES256K';
        break;

      default:
        throw new Error(`'${publicKey.type}' signature not supported yet`);
    }

    if (!publicKey.publicKeyPem.match(RegExp('PUBLIC KEY', 'gi'))) {
      publicKey.publicKeyPem = `-----BEGIN PUBLIC KEY-----\n${publicKey.publicKeyPem}\n-----END PUBLIC KEY-----`;
    }

    const pubKey = JWK.asKey(
      publicKey.publicKeyPem,
      {
        alg,
        use: 'sig'
      }
    );

    JWT.verify(
      jwt,
      pubKey,
      {
        typ: 'JWT',
        audience: config.GLIDER_DID,
        clockTolerance: '1 min'
      }
    );

  } else {
    throw new Error('Signature verification method not found');
  }

  return {
    aud,
    iss,
    exp
  };
};
