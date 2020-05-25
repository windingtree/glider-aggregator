const {
  uniqueObjectsList,
  flatOneDepth
} = require('./utils/collections');

module.exports.mapNdcRequestData_AC = (
  // extract the only needed part of config
  { apiKey, commission, AirlineID, Document, ...config }, // eslint-disable-line no-unused-vars
  offers,
  documentId
) => ({
  ...(JSON.parse(JSON.stringify(config))),
  ...({
    Document: {
      '@id': documentId,
      Name: Document.Name,
      ReferenceVersion: Document.ReferenceVersion
    }
  }),
  Query: {
    Offer: offers.map(offer => ({
      '@Owner': offer.provider,
      '@OfferID': offer.extraData.offerId,
      '@ResponseID': '',
      PassengerID: flatOneDepth(
        Object.entries(offer.offerItems)
          .map(i => i[1].passengerReferences.split(' '))
      )
        .map(i => ({
          '@value': i
        })),
      SegmentID: offer.extraData.segments.map(s => ({
        '@value': s.id
      }))
    }))
  },
  DataLists: {
    PassengerList: {
      Passenger: uniqueObjectsList(
        flatOneDepth(
          offers.map(
            offer => Object.entries(offer.extraData.passengers)
              .map(p => p[1].map(id => ({
                '@PassengerID': id,
                PTC: p[0]
              })))
          )
        )
      )
    },
    FlightSegmentList: {
      FlightSegment: uniqueObjectsList(
        flatOneDepth(
          offers.map(
            offer => offer.extraData.segments.map(s => ({
              '@SegmentKey': s.id,
              '@refs': offer.extraData.destinations
                .filter(d => d.FlightReferences.split(' ').includes(s.id))[0].id,
              Departure: s.Departure,
              Arrival: s.Arrival,
              MarketingCarrier: s.MarketingCarrier,
              OperatingCarrier: s.OperatingCarrier,
              Equipment: s.Equipment,
              ClassOfService: s.ClassOfService,
              FlightDetail: s.FlightDetail
            }))
          )
        )
      )
    }
  }
});
