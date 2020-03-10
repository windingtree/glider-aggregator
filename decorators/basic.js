const { verifyJWT } = require('../helpers/jwt');

const basicDecorator = fn => async (req, res) => {

  try {
    const { headers } = req;

    if (!headers.authorization) {
      throw new Error('Authorization missing');
    }
    
    const auth = headers.authorization.split(' ');
    await verifyJWT(...auth);
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
};
