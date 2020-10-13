/*
  Resolve the order creation from offer of an hotel
  Currently hardcoded to e-revemax
*/
const { createHotelProvider } = require('../../providers/providerFactory');
const { ordersManager } = require('../../../helpers/models/order');
const { refundSettlement } = require('../../guarantee/');

module.exports.cancelOrder = async (orderId) => {
  // Retrieve order
  const orderRecord = await ordersManager.getOrder(orderId);
  const { offer, order: orderDetails, guaranteeClaim, provider, guarantee } = orderRecord;
  const { order: { passengers } } = orderDetails;
  const { settlementId, card } = guaranteeClaim;
  const { amount, currency } = guarantee;
  let providerImpl = createHotelProvider(provider);
  let response = await providerImpl.cancelOrder(orderDetails, offer, passengers, card);
  try {
    let refundResp = await refundSettlement(settlementId, amount, currency);
    console.log('Refund response', refundResp);
  } catch (err) {
    console.log('Refund request failed', err);
  }
  await ordersManager.updateOrderStatus(orderId, 'CANCELLED');
  let result = {
    orderId: orderId,
    order: {
      ...response,
      passengers,
    },
  };
  return result;
};
