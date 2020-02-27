const format = require('date-fns/format');
const config = require('../../config');

const mapNdcRequestData = ({offerId, offerItems, passengers}) => ({
  ...config.airFranceConfig,
  trackingMessageHeader: {
    consumerRef : {
      consumerTime: (new Date(Date.now())).toISOString(),
    },
  },
  Query: {
    Order: {
      Offer: {
        OfferId: offerId,
        Owner: config.airFranceConfig.AirlineID,
        OfferItems: offerItems,
      },
    },
    DataList: {
      passengers,
    },
  },
});

module.exports = {
  mapNdcRequestData,
};
