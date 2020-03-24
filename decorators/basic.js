const GliderError = require('../helpers/error');
const { verifyJWT } = require('../helpers/jwt');
const { indexException, indexEvent } = require('../helpers/elasticsearch');

const basicDecorator = (fn, isAdmin = false) => async (req, res) => {
  // start timer
  req.start = process.hrtime();

  // Inject elastisearch indexer into json method
  const resJsonOrig = res.json;
  const resSendOrig = res.send;
  res.json = (obj) => {
    const response = resJsonOrig(obj);
    indexEvent(req, res);
    return response;
  };
  res.send = (obj) => {
    const response = resSendOrig(obj);
    indexEvent(req, res);
    return response;
  };

  try {
    const { headers } = req;

    if (!headers.authorization) {
      throw new GliderError('Authorization missing', 403);
    }
    
    const [ authType, authJwt ] = headers.authorization.split(' ');
    req.verificationResult = await verifyJWT(authType, authJwt, isAdmin);
    await fn(req, res);
  } catch (e) {
    console.log(e);

    // Here indexing exceptions only
    if ([500, 502].includes(e.status)) {
      indexException(req, e);
    }

    res.status(typeof e.status === 'number' ? e.status : 500).json({
      message: e.message,
      code: e.code ? e.code : undefined// Can contain useful textual codes
    });
  }
};

module.exports = {
  basicDecorator,
};
