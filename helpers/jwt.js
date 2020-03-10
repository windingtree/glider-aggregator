const JWT = require('jsonwebtoken');
const ethers = require('ethers');
const KeyEncoder = require('key-encoder').default;
const { ec, eddsa } = require('elliptic');
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

  const {
    header,
    payload,
    signature
  } = decodedToken;

  if (!validisTyp.includes(header.typ.toLowerCase())) {
    throw new Error('JWT Token header typ invalid');
  }

  if (payload.exp < Date.now() / 1000) {
    throw new Error('JWT Token has Expired');
  }

  const [ did, fragment ] = payload.iss.split('#');
  const didResult = await orgIdResolver.resolve(did);

  console.log('>>>', didResult);

  // Organization should not be disabled
  if (!didResult.organization.state) {
    throw new Error(`The organization: ${didResult.organization.orgId} is disabled`);
  }

  // Lif deposit should be equal or more then configured
  if (Number(web3.utils.fromWei(didResult.lifDeposit.deposit, 'ether')) < process.env.LIF_MIN_DEPOSIT) {
    throw new Error(`Lif token deposit for the organization: ${didResult.organization.orgId} is less then ${process.env.LIF_MIN_DEPOSIT}`);
  }

  const lastPeriod = jwt.lastIndexOf('.');
  const signedMessage = jwt.substring(0, lastPeriod);
  const signatureB16 = (Buffer.from(
    signature
      .toString()
      .replace('-', '+')
      .replace('_', '/'),
    'base64')).toString('hex');
  
  if (!fragment) {
    // Validate signature of the organization owner or director
    const hashedMessage = ethers.utils.hashMessage(signedMessage);
    const signingAddress = ethers.utils.recoverAddress(hashedMessage, `0x${signatureB16}`);

    // Signer address should be an owner address or director address
    // Director have to confirm it ownership
    if (![
      didResult.organization.owner,
      ...(didResult.organization.director !== '0x0000000000000000000000000000000000000000'
          && didResult.organization.directorConfirmed
        ? [didResult.organization.director]
        : [])
    ].includes(signingAddress)) {
      throw new Error('JWT Token not authorized');
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

    const context = new Elc(curveType);
    const keyEncoder = new KeyEncoder(curveType);

    if (!publicKey.publicKeyPem.match(RegExp('PUBLIC KEY', 'gi'))) {
      publicKey.publicKeyPem = `-----BEGIN PUBLIC KEY-----\n${publicKey.publicKeyPem}\n-----END PUBLIC KEY-----`;
    }
    
    // Convert pem form of the public key to a raw value
    const rawPub = keyEncoder.encodePublic(publicKey.publicKeyPem, 'pem', 'raw');
    const key = context.keyFromPublic(rawPub, 'hex');

    // Build r-s signaure form
    const sigParts = signatureB16.match(/([a-f\d]{64})/gi);
    const sig = {
      r: sigParts[0],
      s: sigParts[1]
    };

    if (!key.verify(signedMessage, sig)) {
      throw new Error('JWT Token not authorized');
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
