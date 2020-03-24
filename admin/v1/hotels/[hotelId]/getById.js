const { basicDecorator } = require('../../../../decorators/basic');
const { manager } = require('../../../../helpers/models/mongo/hotels');

module.exports = basicDecorator(async (req, res) => {
  const hotel = await manager.getById(req.query.hotelId);
  res.status(200).json(hotel);
}, true); // true - means administrative route
