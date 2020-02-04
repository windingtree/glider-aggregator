const { verifyJWT, isAuthorized } = require('../helpers/jwt');

const basicDecorator = fn => async (req, res) => {
  try {
    const { headers } = req;
    const auth = headers.authorization.split(' ');
    const { payload, singerAddress } = await verifyJWT(...auth);
    await isAuthorized(payload.iss, singerAddress);
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