const { JWK, JWT } = require('jose');
const expect = require('./expect');

module.exports.createToken = async (options) => {
  expect.all(options, {
    priv: {
      type: 'string'
    },
    alg: {
      type: 'enum',
      values: ['X25519', 'ES256K', 'secp256k1']
    },
    aud: {
      type: 'string'
    },
    iss: {
      type: 'did',
      required: false// just for test case
    },
    fragment: {
      type: 'string',
      required: false
    },
    exp: {
      type: 'string'
    },
    scope: {
      type: 'string',
      required: false
    }
  });

  let alg;

  switch (options.alg) {
    case 'X25519':
      throw new Error('X25519 not supported yet');

    case 'ES256K':
    case 'secp256k1':
      alg = 'ES256K';
      break;
    
    default:
      throw new Error(`'${options.alg}' not supported yet`);
  }

  const priv = JWK.asKey(
    options.priv,
    {
      alg,
      use: 'sig'
    }
  );

  return JWT.sign(
    {
      ...(options.scope ? { scope: options.scope } : {})
    },
    priv,
    {
      audience: options.aud,
      ...(options.iss ? { issuer: `${options.iss}${options.fragment ? '#' + options.fragment : ''}` } : {}),
      expiresIn: options.exp,
      kid: false,
      header: { typ: 'JWT' }
    }
  );
};
