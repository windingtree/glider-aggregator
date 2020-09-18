const GliderError = require('../helpers/error');
const { verifyJWT } = require('../helpers/jwt');
const { indexException, indexEvent } = require('../helpers/elasticsearch');

const basicDecorator = (fn, isAdmin = false) => async (req, res) => {
  // start timer
  req.start = process.hrtime();

  // Logging method
  const elasticLog = (responseMethod, data) => {
    const response = responseMethod(data);

    if (res.exception) {
      indexException(req, res, data);
    }

    indexEvent(req, res, data);
    return response;
  };

  // Inject elastisearch indexer into json method
  const resJsonOrig = res.json;
  const resSendOrig = res.send;
  res.json = data => elasticLog(resJsonOrig, data);
  res.send = data => elasticLog(resSendOrig, data);

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
    res.exception = e;
    res.status(typeof e.status === 'number' ? e.status : 500).json({
      message: e.message,
      ...(e.code ? { code: e.code } : {})// Can contain useful textual codes
    });
  }
};

module.exports = {
  basicDecorator,
};
