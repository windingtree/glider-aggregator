const format = require('date-fns/format');
const { airFranceConfig } = require('../../config');

const mapNdcRequestData = ({offerId, offerItems, passengers}) => ({
  ...airFranceConfig,
  trackingMessageHeader: {
    consumerRef : {
      consumerTime: (new Date(Date.now())).toISOString(),
    },
  },
  Query: {
    Order: {
      Offer: {
        OfferId: offerId,
        Owner: airFranceConfig.AirlineID,
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
