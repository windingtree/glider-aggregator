const { basicDecorator } = require('../../../decorators/basic');
const { manager } = require('../../../helpers/models/mongo/hotels');
const GliderError = require('../../../helpers/error');

module.exports = basicDecorator(async (req, res) => {
  let searchMethod;
  let searchQuery;

  if (typeof req.body.point === 'object') {
    searchMethod = 'searchByLocation';
    searchQuery = req.body.point;
  } else if (Array.isArray(req.body.polygon)) {
    searchMethod = 'searchWithin';
    searchQuery = req.body.polygon;
  } else {
    throw new GliderError(
      'Unknown search method',
      405
    );
  }
  
  const hotels = await manager[searchMethod](
    searchQuery,
    req.body.sort ? req.body.sort : null,
    req.body.skip ? req.body.skip : 0,
    req.body.limit ? req.body.limit : null
  );
  
  res.status(200).json(hotels);
}, true); // true - means administrative route
