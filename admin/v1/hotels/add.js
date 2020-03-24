const { basicDecorator } = require('../../../decorators/basic');
const { manager } = require('../../../helpers/models/mongo/hotels');

module.exports = basicDecorator(async (req, res) => {
  const hotel = await manager.addOne(req.body);
  res.status(200).json({
    id: hotel._id
  });
}, true); // true - means administrative route
