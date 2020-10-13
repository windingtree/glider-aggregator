const GliderError = require('../../../helpers/error');
const { basicDecorator } = require('../../../decorators/basic');
const { cancelOrder } = require('../../../helpers/resolvers/hotel/cancelOrder');



module.exports = basicDecorator(async (req, res) => {
  const requestBody = req.body;
  const { orderId } = requestBody;
  if (!orderId) {
    throw new GliderError('Missing mandatory field: orderId', 400);
  }
  let orderCancelResult = await cancelOrder(orderId);

  res.status(200).json(orderCancelResult);
});
