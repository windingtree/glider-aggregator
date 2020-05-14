const format = require('date-fns/format');
const {
  uniqueObjectsList,
  flatOneDepth
} = require('./utils/collections');

module.exports.mapNdcRequestData_AC = (
  { apiKey, commission, AirlineID, Document, ...config },// extract the only needed part of config
  offers,
  body,
  documentId = 'OneWay'
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
      TotalOfferPrice: {
        '@Code': offer.currency,
        '@value': offer.amountAfterTax
      },
      OfferItem: Object.entries(offer.offerItems).map(i => ({
        '@OfferItemID': i[0],
        PassengerRefs: i[1].passengerReferences.split(' ').map(
          p => offer.extraData.mappedPassengers[p]
        ).join(' ')
      }))
    }))
  },
  DataLists: {
    PassengerList: {
      Passenger: uniqueObjectsList(
        flatOneDepth(
          offers.map(
            offer => Object.entries(offer.extraData.passengers)
              .reduce(
                (a, v) => {
                  v[1].forEach(p => {
                    a.push({
                      '@PassengerID': offer.extraData.mappedPassengers[p],
                      PTC: v[0]
                    });
                  });
                  return a;
                },
                []
              )
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
              '@ElectronicTicketInd': true,
              ...(Array.isArray(body) && body.length > 0 ? {
                '@refs': body.reduce(
                  (a, v, i) => {
                    if (v.segment === s.id &&
                        offer.extraData.mappedPassengers[v.passenger]) {
                      a = `${a} SRVC-OS-${i + 1}`;
                    }
                    return a.trim();
                  },
                  ''
                )
              } : {}),
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
    },
    OriginDestinationList: {
      OriginDestination: uniqueObjectsList(
        flatOneDepth(
          offers.map(
            offer => offer.extraData.destinations.map(d => ({
              '@OriginDestinationKey': d.id,
              DepartureCode: d.DepartureCode,
              ArrivalCode: d.ArrivalCode,
              FlightReferences: d.FlightReferences
            }))
          )
        )
      )
    },
    ServiceDefinitionList: {
      ...(Array.isArray(body) && body.length > 0 ? {
        ServiceDefinition: body.map((s, i) => ({
          '@ServiceDefinitionID': `SRVC-OS-${i + 1}`,
          '@Owner': 'AC',
          Descriptions: {
            Description: {
              '@refs': offers.reduce(
                (a, v) => {
                  if (v.extraData.mappedPassengers[s.passenger]) {
                    a = v.extraData.mappedPassengers[s.passenger];
                  }
                  return a;
                },
                ''
              ),
              Text: `|${s.code.replace('.', '=')}|`
            }
          }
        }))
      } : {})
    }
  }
});