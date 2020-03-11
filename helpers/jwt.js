const JWT = require('jsonwebtoken');
const ethers = require('ethers');
const KeyEncoder = require('key-encoder').default;
const { curves, ec, eddsa } = require('elliptic');
const hash = require('hash.js');
const Web3 = require('web3');
const { OrgIdResolver, httpFetchMethod } = require('@windingtree/org.id-resolver');
const { addresses } = require('@windingtree/org.id');
const web3 = new Web3(process.env.INFURA_ENDPOINT);

// ORG.ID resolver configuration
const orgIdResolver = new OrgIdResolver({
  web3,
  orgId: addresses.ropsten // @todo Set the network type on the base of environment config
});
orgIdResolver.registerFetchMethod(httpFetchMethod);

const validisTyp = ['jwt', 'application/jwt'];

const verifyJWT = async (type, jwt) => {

  if (type !== 'Bearer') {
    throw new Error('JWT Token format is not valid');
  };

  const decodedToken = JWT.decode(jwt, {
    complete: true
  });

  if (!decodedToken) {
    throw new Error('JWT Token format is not valid');
  };

  const { header, payload, signature } = decodedToken;

  // if (process.env.TESTING) console.log('>>>', JSON.stringify(decodedToken, null, 2));

  if (!validisTyp.includes(header.typ.toLowerCase())) {
    throw new Error('JWT Token header typ invalid');
  }

  // Token must not be expired
  if (payload.exp < Date.now() / 1000) {
    throw new Error('JWT Token has Expired');
  }

  // Issuer should be defined
  if (!payload.iss || payload.iss === '') {
    throw new Error('JWT Token is missing issuing ORG.ID');
  }

  // Resolve did to didDocument
  const [ did, fragment ] = payload.iss.split('#');
  const didResult = await orgIdResolver.resolve(did);

  // if (process.env.TESTING) console.log('>>>', JSON.stringify(didResult, null, 2));

  // Organization should not be disabled
  if (!didResult.organization.state) {
    throw new Error(`The organization: ${didResult.organization.orgId} is disabled`);
  }

  // Lif deposit should be equal or more then configured
  if (Number(web3.utils.fromWei(didResult.lifDeposit.deposit, 'ether')) < process.env.LIF_MIN_DEPOSIT) {
    throw new Error(`Lif token deposit for the organization: ${didResult.organization.orgId} is less then ${process.env.LIF_MIN_DEPOSIT}`);
  }

  const lastPeriod = jwt.lastIndexOf('.');
  const jwtMessage = jwt.substring(0, lastPeriod);
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

  if (!fragment) {
    // Validate signature of the organization owner or director
    
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

    let curveType;
    let Elc;

    switch (publicKey.type) {
      case 'X25519':
        curveType = 'ed25519';
        Elc = eddsa;
        break;

      case 'secp256k1':
        curveType = 'secp256k1';
        Elc = ec;
        break;
      
      default:
        throw new Error('Signature verification method not found');
    }

    const context = new Elc({
      curve: curves[curveType],
      hash: hash.sha256
    });
    
    const keyEncoder = new KeyEncoder({
      publicPEMOptions: { label: 'PUBLIC KEY' },
      curve: context
    });

    if (!publicKey.publicKeyPem.match(RegExp('PUBLIC KEY', 'gi'))) {
      publicKey.publicKeyPem = `-----BEGIN PUBLIC KEY-----\n${publicKey.publicKeyPem}\n-----END PUBLIC KEY-----`;
    }

    // Convert pem form of the public key to a raw value
    const rawPub = keyEncoder.encodePublic(publicKey.publicKeyPem, 'pem', 'raw');
    const keystore = context.keyFromPublic(rawPub, 'hex');

    if (!keystore.validate().result) {
      throw new Error('Invalid public key');
    }

    const signParts = signatureB16.match(/([a-f\d]{64})/gi);
    const sign = {
      r: signParts[0],
      s: signParts[1]
    };

    if (!context.verify(jwtMessage, sign, keystore.getPublic())) {
      throw new Error('Invalid signature');
    }

  } else {
    throw new Error('Signature verification method not found');
  }

  return {
    header,
    payload,
    signature
  };
};

module.exports = {
  verifyJWT
};
