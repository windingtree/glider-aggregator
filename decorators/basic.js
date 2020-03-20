const GliderError = require('../helpers/error');
const { verifyJWT } = require('../helpers/jwt');
const { indexException, indexEvent } = require('../helpers/elasticsearch');

const basicDecorator = fn => async (req, res) => {
  // start timer
  req.start = process.hrtime();

  // Inject elastisearch indexer into json method
  const resjsonOrig = res.json;
  res.json = (obj) => {
    const response = resjsonOrig(obj);
    indexEvent(req, res);
    return response;
  };

  try {
    const { headers } = req;

    if (!headers.authorization) {
      throw new GliderError('Authorization missing', 403);
    }
    
    const auth = headers.authorization.split(' ');
    req.verificationResult = await verifyJWT(...auth);
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
