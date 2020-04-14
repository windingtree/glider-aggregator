const { basicDecorator } = require('../../../decorators/basic');
const GliderError = require('../../../helpers/error');
const { manager } = require('../../../helpers/models/mongo/apiCallsLimits');

module.exports = basicDecorator(async (req, res) => {
  const { method, query, body } = req;
  let result;

  if (method !== 'GET' && !query.apiEndpoint) {
    throw new GliderError(
      'apiEndpoint parameter is required',
      400
    );
  }

  switch (method) {
    case 'GET':
      
      if (query.apiEndpoint) {
        result = await manager.get(query.apiEndpoint);
        res.status(200).json(result.tiers);
      } else {
        result = await manager.getAll();
        res.status(200).json(result);
      }
      
      break;

    case 'POST':

      await manager.add(
        query.apiEndpoint,
        body
      );
      res.status(200).send('OK');
      break;

    case 'PUT':
      
      await manager.update(
        query.apiEndpoint,
        body
      );
      res.status(200).send('OK');
      break;

    case 'DELETE':
      await manager.remove(
        query.apiEndpoint
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
