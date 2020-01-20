const { airFranceConfig } = require('../../config');

const mapNdcRequestData = ({itinerary, passengers}) => {
  const ndcRequestData = {
    ...airFranceConfig,
    PointOfSale: {
      RequestTime: (new Date(Date.now())).toISOString(),
    },
    CoreQuery: {
     // Later this should be updated to support multi-city search
      OriginDestinations: {
        OriginDestination: {
          Departure: {
            AirportCode: itinerary.segments[0].origin.locationType === 'airport'
              ? itinerary.segments[0].origin.iataCode : undefined,
            Date: itinerary.segments[0].departureDate,
            Time: itinerary.segments[0].departureTime,
          },
          Arrival: {
            AirportCode: itinerary.segments[0].destination.locationType === 'airport'
              ? itinerary.segments[0].destination.iataCode : undefined,
          },
        },
      },
      Preference: {
        CabinPreferences: {
          CabinType: {
            Code: 5,
          },
        },
      },
      DataLists: {
        PassengerList: passengers.map(p => ({
          Passenger: {
            PTC: p.type,
          },
        })),
      },
    },
  };
 return ndcRequestData;
}

module.exports = {
  mapNdcRequestData,
};
