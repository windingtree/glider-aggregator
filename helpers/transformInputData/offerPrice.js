const format = require('date-fns/format');

module.exports.mapNdcRequestData_AC = (
  { apiKey, commission, AirlineID, ...config },// extract the only needed part of config
  offer
) => ({
  ...(JSON.parse(JSON.stringify(config))),
  DataLists: {
    PassengerList: {
      Passenger: Object.entries(offer.extraData.passengers).reduce((a, v) => {
        v[1].forEach(p => {
          a.push({
            '@PassengerID': offer.extraData.mappedPassengers[p],
            PTC: v[0]
          });
        });
        return a;
      }, [])
    },      
    FlightSegmentList: {
      FlightSegment: offer.extraData.segments.map(s => ({
        '@SegmentKey': s.id,
        '@ElectronicTicketInd': true,
        Departure: s.Departure,
        Arrival: s.Arrival,
        MarketingCarrier: s.MarketingCarrier,
        OperatingCarrier: s.OperatingCarrier,
        Equipment: s.Equipment,
        ClassOfService: s.ClassOfService,
        FlightDetail: s.FlightDetail
      }))
    },
    OriginDestinationList: {
      OriginDestination: offer.extraData.destinations.map(d => ({
        '@OriginDestinationKey': d.id,
        DepartureCode: d.DepartureCode,
        ArrivalCode: d.ArrivalCode,
        FlightReferences: d.FlightReferences
      }))
    },
    ServiceDefinitionList: {}
  }
});