const { basicDecorator } = require('../../../../decorators/basic');
const { manager } = require('../../../../helpers/models/mongo/hotels');

module.exports = basicDecorator(async (req, res) => {
  await manager.updateOne(
    req.query.hotelId,
    req.body
  );
  res.status(200).send('OK');
}, true); // true - means administrative route
