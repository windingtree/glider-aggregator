const format = require('date-fns/format');

module.exports.mapNdcRequestData_AC = (
  { apiKey, commission, AirlineID, ...config },// extract the only needed part of config
  offer,
  body
) => ({
  ...(JSON.parse(JSON.stringify(config))),
  DataLists: {
    PassengerList: {
      Passenger: Object.entries(body.passengers).map(p => ({
        '@PassengerID': p[0],
        PTC: p[1].type,
        // Birthdate: format(new Date(p[1].birthdate), 'yyyy-MM-dd'),
        // Individual: {
        //   Gender: p[1].gender,
        //   NameTitle: p[1].civility,
        //   GivenName: p[1].lastnames.join(' '),
        //   Surname: p[1].firstnames.join(' ')
        // }
      }))
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