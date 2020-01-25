const format = require('date-fns/format');
const { airFranceConfig } = require('../../config');

const mapNdcRequestData = ({offerId, offerItemId, passengers}) => ({
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
        OfferItems: [
          {
            OfferItemId: offerItemId,
            PassengerRefs: Object.keys(passengers),
          },
        ],
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
