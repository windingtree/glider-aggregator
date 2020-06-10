const { GliderError } = require('../../error');
const {
  offerManager
} = require('../../models/offer');

// Set orderStatus flag for offers
module.exports.setOrderStatus = async (offers, orderStatus) => Promise.all(
  offers.map(
    async offer => {
      offer = {
        ...offer,
        extraData: {
          ...(
            offer.extraData ? {
              ...offer.extraData,
              orderStatus
            } : {
              orderStatus
            }
          )
        }
      };

      return offerManager.saveOffer(offer.offerId, {
        offer
      });
    }
  )
);

module.exports.assertOrgerStatus = offers => offers.forEach(offer => {
  if (offer.extraData && offer.extraData.orderStatus === 'CREATING') {
    throw new GliderError(
      'Order creation ongoing for this offer',
      400
    );
  }

  if (offer.extraData && offer.extraData.orderStatus === 'CREATED') {
    throw new GliderError(
      'Order already created for this offer',
      400
    );
  }
});
