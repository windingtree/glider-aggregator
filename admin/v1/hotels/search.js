const { basicDecorator } = require('../../../decorators/basic');
const { manager } = require('../../../helpers/models/mongo/hotels');
const GliderError = require('../../../helpers/error');

module.exports = basicDecorator(async (req, res) => {
  const { query } = req;
  let parsedQuery;
  let searchMethod;
  let searchQuery;

  const parsePolygon = query => {

    if (!query.polygon) {
      return null;
    }

    return query.polygon
      .map(q => q.split(',').map(v => Number(v)));
  };

  const parseDeepObject = (query, prop) => Object.entries(query)
    .filter(e => new RegExp(`^${prop}`).test(e[0]))
    .reduce((a, v) => {
      const parts = v[0].match(/^\w+\[(\w+)\]/);
      a = a === null ? {} : a;
      a[parts[1]] = Number(v[1]);
      return a;
    }, null);
  
  try {
    parsedQuery = {
      polygon: parsePolygon(query),
      rectangle: parseDeepObject(query, 'rectangle'),
      circle: parseDeepObject(query, 'circle'),
      skip: Number(query.skip || 0),
      limit: Number(query.limit || 0)
    };
  } catch (e) {
    throw new GliderError(
      `Query parsing error: ${e.message}`,
      400
    );
  }

  if (parsedQuery.circle) {
    searchMethod = 'searchByLocation';
    searchQuery = parsedQuery.circle;
  } else if (Array.isArray(parsedQuery.polygon)) {
    searchMethod = 'searchWithin';
    searchQuery = parsedQuery.polygon;
  } else if (parsedQuery.rectangle) {
    searchMethod = 'searchWithin';
    searchQuery = [
      [
        parsedQuery.rectangle.west,
        parsedQuery.rectangle.north
      ],
      [
        parsedQuery.rectangle.east,
        parsedQuery.rectangle.north
      ],
      [
        parsedQuery.rectangle.east,
        parsedQuery.rectangle.south
      ],
      [
        parsedQuery.rectangle.west,
        parsedQuery.rectangle.south
      ]
    ];
  } else {
    throw new GliderError(
      'Unknown search method',
      405
    );
  }

  const hotels = await manager[searchMethod](
    searchQuery,
    parsedQuery.skip ? parsedQuery.skip : 0,
    parsedQuery.limit ? parsedQuery.limit : null
  );
  
  res.status(200).json(hotels);
}, true); // true - means administrative route
