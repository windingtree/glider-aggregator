const { basicDecorator } = require('../../../decorators/basic');
const { manager } = require('../../../helpers/models/mongo/hotels');
const GliderError = require('../../../helpers/error');


module.exports = basicDecorator(async (req, res) => {
  const { method, query, body } = req;
  let result;

  switch (method) {
    
    case 'GET':
      if(query.hotelId) {
        result = await manager.getById(query.hotelId);
      } else {
        result = await manager.get(
          {},
          Number(query.skip),
          Number(query.limit)
        );
      }
      res.status(200).json(result);
      break;

    case 'POST':
    case 'PUT':
      // If hotelID provided, only this one is updated
      if(query.hotelId) {
        await manager.updateOne(
          query.hotelId,
          body
        );
        res.status(200).send('OK');
      }

      // Otherwise it is added in bulk
      else {
        result = await manager.addBulk(body);
        res.status(200).json(result.map(h => ({ id: h._id })));
      }

      break;

    case 'DELETE':
      await manager.removeOne(
        query.hotelId
      );
      res.status(200).send('OK');
      break;

    default:
      throw new GliderError(
        'Method not allowed',
        405
      );
  }
}, true); // true - means administrative route