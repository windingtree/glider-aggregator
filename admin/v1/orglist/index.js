const { basicDecorator } = require('../../../decorators/basic');
const GliderError = require('../../../helpers/error');
const { manager } = require('../../../helpers/models/mongo/orgIdLists');

module.exports = basicDecorator(async (req, res) => {
  const { method, query, body } = req;
  let result;

  if (!query.listName) {
    throw new GliderError(
      'listName parameter is required',
      400
    );
  }

  switch (method) {
    case 'GET':
      result = await manager.get(query.listName);
      res.status(200).json(result);
      break;

    case 'POST':
      await manager.addBulk(
        query.listName,
        body
      );
      res.status(200).send('OK');
      break;

    case 'DELETE':
      await manager.removeBulk(
        query.listName,
        body
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
