const { ec, eddsa } = require('elliptic');
const expect = require('./expect');

module.exports.createJWT = async (
  keystore,
  options
) => {
  expect.all(keystore, {
    priv: {
      type: 'string'
    }
  });
  expect.all(options, {
    ctype: {
      type: 'enum',
      values: ['X25519', 'secp256k1']
    },
    alg: {
      type: 'string'
    },
    iss: {
      type: 'did'
    },
    fragment: {
      type: 'string',
      required: false
    },
    aud: {
      type: 'string'
    },
    exp: {
      type: 'number'
    }
  });

  const header = {
    alg: options.alg,
    typ: 'JWT'
  };

  const now = Math.floor(new Date().getTime()/1000);
  const expiry = parseInt(options.exp, 10) + now;
  const payload = {
    iss: `${options.iss}${options.fragment ? '#' + options.fragment : ''}`,
    aud: options.aud,
    exp: expiry,
    scope: ''
  };

  const headerString = JSON.stringify(header);
  const payloadString = JSON.stringify(payload);

  let jwtMessage = `${Buffer.from(headerString).toString('base64')}.${Buffer.from(payloadString).toString('base64')}`;
  jwtMessage = jwtMessage.replace(/\=/g, '');
  jwtMessage = jwtMessage.replace(/\+/g, '-');
  jwtMessage = jwtMessage.replace(/\//g, '_');

  let curveType;
  let Elc;

  switch (options.ctype) {
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
  const key = context.keyFromPrivate(keystore.priv, 'hex');
  const rawSignature = key.sign(jwtMessage);
  const sigValueB64 = Buffer
    .from(rawSignature.toDER())
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .split('=')[0];
  
  return {
    jwt: `${jwtMessage}.${sigValueB64}`,
    jwtMessage,
    rawSignature,
    key
  };
};
