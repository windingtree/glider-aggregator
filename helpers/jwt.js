const { JWK, JWT } = require('jose');
const ethers = require('ethers');
const Web3 = require('web3');
const { OrgIdResolver, httpFetchMethod } = require('@windingtree/org.id-resolver');
const { addresses: orgIdAddresses } = require('@windingtree/org.id');
const { addresses: lifDepositAddresses } = require('@windingtree/org.id-lif-deposit');
const GliderError = require('./error');
const { redisClient } = require('./redis');
const { toChecksObject } = require('./json');

const config = require('../config');
const web3 = new Web3(config.INFURA_URI);

// ORG.ID resolver configuration
const defaultNetwork = 'ropsten'; // @todo Set the network type on the base of environment config
const orgIdResolver = new OrgIdResolver({
  web3,
  orgId: orgIdAddresses[defaultNetwork],
  lifDeposit: lifDepositAddresses[defaultNetwork]
});
orgIdResolver.registerFetchMethod(httpFetchMethod);

module.exports.verifyJWT = async (type, jwt, isAdmin = false) => {
  
  if (type !== 'Bearer') {
    throw new GliderError('Unknown authorization method', 403);
  };

  let decodedToken;

  try {
    decodedToken = JWT.decode(jwt, {
      complete: true
    });
  } catch (e) {
    switch (e.code) {
      case 'ERR_JWT_MALFORMED':
        e.message = 'JWT is malformed';
        e.code = 403;
        break;

      default:
    }
    
    throw new GliderError(e.message, e.code);
  }

  const { payload: { exp, aud, iss } } = decodedToken;

  // Issuer should be defined
  if (!iss || iss === '') {
    throw new GliderError('JWT is missing issuing ORG.ID', 403);
  }

  // Resolve did to didDocument
  const { did, fragment } = iss.match(/(?<did>did:orgid:0x\w{64})(?:#{1})?(?<fragment>\w+)?/).groups;
  
  let didResult;
  const cachedDidResult = JSON.parse(await redisClient.asyncGet(`didResult_${did}`));

  if (cachedDidResult && typeof cachedDidResult.didDocument === 'object') {
    didResult = cachedDidResult;
  } else {
    didResult = await orgIdResolver.resolve(did);
    const checks = toChecksObject(didResult.checks);
    
    // didDocument should be resolved
    if (!checks.DID_DOCUMENT.passed) {
      throw new GliderError(
        checks.DID_DOCUMENT.errors.join('; '),
        403
      );
    }
    
    redisClient.set(
      `didResult_${did}`,
      JSON.stringify(didResult),
      'EX',
      60 * 60 * 12, // 12 hours
      (err) => {
        if (err) {
          throw new GliderError(err.message, 500);
        }
      }
    );
  }

  // Organization should not be disabled
  if (!didResult.organization.isActive) {
    throw new GliderError(
      `Organization: ${didResult.organization.orgId} is disabled`,
      403
    );
  }

  // Lif deposit should be equal or more then configured
  didResult.lifDeposit.deposit = didResult.lifDeposit.deposit ? didResult.lifDeposit.deposit : '0';
  if (Number(web3.utils.fromWei(didResult.lifDeposit.deposit, 'ether')) < config.LIF_MIN_DEPOSIT) {
    throw new GliderError(
      `Lif token deposit insuficient: ${didResult.organization.orgId} has less than ${config.LIF_MIN_DEPOSIT} LIF`,
      403
    );
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
          && didResult.organization.isDirectorshipAccepted
        ? [didResult.organization.director]
        : [])
    ].includes(signingAddress)) {
      throw new GliderError('JWT Token is signed by unknown key', 403);
    }

  } else if (fragment && didResult.didDocument.publicKey) {
    // Validate signature using publickKey
    
    let publicKey = didResult.didDocument.publicKey.filter(
      p => p.id.match(RegExp(`#${fragment}$`, 'g'))
    )[0];

    if (!publicKey) {
      throw new GliderError(
        'Public key definition not found in the DID document',
        403
      );
    }

    let alg;

    switch (publicKey.type) {
      case 'ES256K':
      case 'secp256k1':
        alg = 'ES256K';
        break;

      default:
        throw new GliderError(
          `'${publicKey.type}' signature not supported yet`,
          403
        );
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

    try {
      JWT.verify(
        jwt,
        pubKey,
        {
          typ: 'JWT',
          audience: config.GLIDER_DID,
          ...(isAdmin ? { issuer: config.GLIDER_ADMIN_DID } : {})
        }
      );
    } catch (e) {

      switch (e.code) {
        case 'ERR_JWT_EXPIRED':
          e.message = 'JWT is expired';
          break;

        case 'ERR_JWT_CLAIM_INVALID':

          if (e.claim === 'aud') {
            e.message = 'JWT recipient is not Glider';
          }
          
          // Raised only in case of Admin
          else if (e.claim === 'iss') {
            e.message = 'JWT must be created by a Glider authorized agent';
          }
          break;

        case 'ERR_JWS_VERIFICATION_FAILED':
          e.message = 'JWT signature verification failed';
          break;

        default:
      }

      throw new GliderError(e.message, 403);
    }

  } else {
    throw new GliderError(
      'Signature verification method not found',
      403
    );
  }

  return {
    aud,
    iss,
    exp,
    didResult
  };
};
