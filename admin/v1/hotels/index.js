const { basicDecorator } = require('../../../decorators/basic');
const { manager } = require('../../../helpers/models/mongo/hotels');
const GliderError = require('../../../helpers/error');


module.exports = basicDecorator(async (req, res) => {
  const { method, query, body } = req;
  let result;

  switch (method) {
    case 'POST':
      result = await manager.addBulk(body);
      res.status(200).json(result.map(h => ({ id: h._id })));
      break;
    
    case 'GET':
      result = await manager.getById(query.hotelId);
      res.status(200).json(result);
      break;

    case 'PUT':
      await manager.updateOne(
        query.hotelId,
        body
      );
      res.status(200).send('OK');
      break;

    case 'DELETE':
      await manager.removeOne(
        query.hotelId
      );
      res.status(200).send('OK');
      break;

    default:
      throw new GliderError(
        'Unknown request method',
        400
      );
  }
}, true); // true - means administrative route