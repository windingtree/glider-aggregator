const GliderError = require('../../helpers/error');
const { basicDecorator } = require('../../decorators/basic');
const { offerPriceRQ } = require('../../helpers/resolvers/flight/offerPrice');
const { validateOptionSelection } = require('../../payload/validators');
module.exports = basicDecorator(async (req, res) => {
  const { method, query, body } = req;
  if (method !== 'POST') {
    throw new GliderError(
      'Method not allowed',
      405,
    );
  }
  validateOptionSelection(body);

  const offerResult = await offerPriceRQ(query.offerIds, body);

  res.status(200).json(offerResult);
});
