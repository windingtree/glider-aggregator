const GliderError = require('../../helpers/error');
const { basicDecorator } = require('../../decorators/basic');
const { seatMapRQ } = require('../../helpers/resolvers/flight/seatAvailability');

module.exports = basicDecorator(async (req, res) => {
  const { method, query } = req;

  if (method !== 'GET') {
    throw new GliderError(
      'Method not allowed',
      405
    );
  }

  const seatResult = await seatMapRQ(query.offerIds);

  res.status(200).json(seatResult);
});
