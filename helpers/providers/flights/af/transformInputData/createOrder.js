
/* istanbul ignore next */
module.exports.mapNdcRequestData_AF = (config, { offerId, offerItems, passengers }) => ({
  ...(JSON.parse(JSON.stringify(config))),
  trackingMessageHeader: {
    consumerRef : {
      consumerTime: (new Date(Date.now())).toISOString(),
    },
  },
  Query: {
    Order: {
      Offer: {
        OfferId: offerId,
        Owner: config.AirlineID,
        OfferItems: offerItems,
      },
    },
    DataList: {
      passengers,
    },
  },
});

