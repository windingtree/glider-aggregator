const { basicDecorator } = require('../../../decorators/basic');
const { manager } = require('../../../helpers/models/mongo/hotels');

module.exports = basicDecorator(async (req, res) => {
  const hotels = await manager.addBulk(req.body);
  res.status(200).json(hotels.map(h => ({ id: h._id })));
}, true); // true - means administrative route
