const JWT = require('jsonwebtoken');
const ethers = require('ethers');
const { organizationAbi } = require('./contracts/organization');

const validisTyp = ["jwt", 'application/jwt'];
const verifyJWT = (type, jwt) => {
  if (type !== 'Bearer') throw new Error('JWT Token format is not valid');
  
  const decodedToken = JWT.decode(jwt, {complete: true});
  if(!decodedToken) throw new Error('JWT Token format is not valid');
  const { header, payload, signature} = decodedToken;
  
  if(!validisTyp.includes(header.typ.toLowerCase())) throw new Error('JWT Token header typ invalid');
  if(header.alg !== 'ETH') throw new Error('JWT Token algorithm must be ETH');
 
  if (payload.exp < Date.now()/1000) throw new Error('JWT Token has Expired');

  const lastPeriod = jwt.lastIndexOf('.');

  const signedMessage = jwt.substring(0, lastPeriod);
  const sigatureB64 = jwt.substring(lastPeriod + 1);

  const signatureB16 = (Buffer.from(sigatureB64.toString().replace('-', '+').replace('_', '/'), 'base64')).toString('hex');
  const hashedMessage = ethers.utils.hashMessage(signedMessage);
  const signingAddress = ethers.utils.recoverAddress(hashedMessage, `0x${signatureB16}`);

  return { header, payload, signature, signingAddress };
};

const isAuthorized = async (contractAddress, signer) => {
  const provider = ethers.getDefaultProvider('ropsten');
  const contract = new ethers.Contract(contractAddress, organizationAbi, provider);
  
  const owner = await contract.owner();
  if (owner === signer) return;
  
  const isAssociadtedKey = await contract.hasAssociatedKey(signer);
  if(!isAssociadtedKey) throw new Error('JWT Token not authorized');
};

module.exports = {
  verifyJWT,
  isAuthorized,
};