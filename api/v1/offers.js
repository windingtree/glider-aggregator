const GliderError = require('../../helpers/error');
const { basicDecorator } = require('../../decorators/basic');
const { offerPriceRQ } = require('../../helpers/resolvers/flight/offerPrice');

module.exports = basicDecorator(async (req, res) => {
  const { method, query } = req;

  if (method !== 'POST') {
    throw new GliderError(
      'Method not allowed',
      405
    );
  }

  const offerResult = await offerPriceRQ(query.offerIds);

  res.status(200).json(offerResult);
});
