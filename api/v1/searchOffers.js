const { basicDecorator } = require('../../decorators/basic');
const { searchHotel } = require('../../helpers/resolvers/searchHotel');
const { searchFlight } = require('../../helpers/resolvers/searchFlight');

module.exports = basicDecorator(async (req, res) => {
  const { body } = req;

  let resolver = () => {throw new Error('acomodation or itinerary missing in body');};
  
  if(body.acomodation) resolver = searchHotel;
  if(body.itinerary) resolver = searchFlight;

  const result = await resolver(body);

  res.status(200).json(result);  
});