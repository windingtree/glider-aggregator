const { basicDecorator } = require('../../decorators/basic');
const GliderError = require('../../helpers/error');
const { searchHotel } = require('../../helpers/resolvers/searchHotel');
const { searchFlight } = require('../../helpers/resolvers/searchFlight');

module.exports = basicDecorator(async (req, res) => {
  const { body } = req;

  let resolver = () => {
    throw new GliderError(
      'accommodation or itinerary missing in body',
      400
    );
  };

  if (body.accommodation) {
    resolver = searchHotel;
  };

  if (body.itinerary) {
    resolver = searchFlight;
  }

  throw new GliderError('AAA', 500);

  const result = await resolver(body);

  res.status(200).json(result);
});
