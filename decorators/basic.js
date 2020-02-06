const { verifyJWT, isAuthorized } = require('../helpers/jwt');

const basicDecorator = fn => async (req, res) => {
  try {
    const { headers } = req;
    if (!headers.authorization) throw new Error('Authorization missing');
    const auth = headers.authorization.split(' ');
    const { payload, signingAddress } = await verifyJWT(...auth);
    await isAuthorized(payload.iss, signingAddress);
    await fn(req, res);
  } catch (e) {
    console.log(e);
    res.status(500).json({
      message: e.message,
    });  
  }
};

module.exports = {
  basicDecorator,
}