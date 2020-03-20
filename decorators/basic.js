const GliderError = require('../helpers/error');
const { verifyJWT } = require('../helpers/jwt');

const basicDecorator = fn => async (req, res) => {

  try {
    const { headers } = req;

    if (!headers.authorization) {
      throw new GliderError('Authorization missing', 403);
    }
    
    const auth = headers.authorization.split(' ');
    await verifyJWT(...auth);
    await fn(req, res);
  } catch (e) {
    console.log(e);
    res.status(typeof e.status === 'number' ? e.status : 500).json({
      message: e.message,
      code: e.code ? e.code : undefined// Can contain useful textual codes
    });
  }
};

module.exports = {
  basicDecorator,
};
