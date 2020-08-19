const format = require('date-fns/format');

const expandPassengers = (passengers) => {
  var res = [];

  for(let p of passengers) {
    // Create a default value
    if(!p.count) {
      res.push(p);
    }

    // Otherwise create one for each count
    else {
      const count = p.count;
      delete p.count;
      for(let i=0; i<count; i++) {
        res.push(p);
      }
    }
  }
  
  return res;
};
module.exports.expandPassengers = expandPassengers;

// Build request data for the request to the AirFrance provider
/* istanbul ignore next */
module.exports.mapNdcRequestData_AF = (config, { itinerary, passengers }) => ({
  ...(JSON.parse(JSON.stringify(config))),
  PointOfSale: {
    RequestTime: (new Date(Date.now())).toISOString(),
  },
  CoreQuery: {
    // Origin Destinations contains the list of segments
    OriginDestinations: itinerary.segments.map(segment => ({
      OriginDestination: {
        // Departure Information
        Departure: {
          AirportCode: segment.origin.locationType === 'airport'
            ? segment.origin.iataCode
            : undefined,
          Date: format(new Date(segment.departureTime), 'yyyy-MM-dd'),
          Time: format(new Date(segment.departureTime), 'HH:mm'),
        },

        // Arrival Information
        Arrival: {
          AirportCode: segment.destination.locationType === 'airport'
            ? segment.destination.iataCode
            : undefined
        }
      }
    })),
    
    // Preference
    Preference: {
      CabinPreferences: {
        CabinType: {
          Code: 5 // Economy
        }
      }
    },

    // Lists
    DataLists: {
      PassengerList: expandPassengers(passengers).map(p => ({
        Passenger: {
          PTC: p.type,
        }
      }))
    }
  }
});

// Build request data for the request to the AirCanada provider
module.exports.mapNdcRequestData_AC = (
  // extract the only needed part of config
  { apiKey, commission, AirlineID, Document, baseUrl, baseUrlPci, ...config }, // eslint-disable-line no-unused-vars
  { itinerary, passengers },
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
  CoreQuery: {
    OriginDestinations: itinerary.segments.map(segment => ({
      OriginDestination: {
        // Departure Information
        Departure: {
          AirportCode: (segment.origin.locationType === 'airport'
            ? segment.origin.iataCode
            : undefined),
          Date: format(new Date(segment.departureTime), 'yyyy-MM-dd'),
          Time: format(new Date(segment.departureTime), 'HH:mm'),
        },

        // Arrival Information
        Arrival: {
          AirportCode: segment.destination.locationType === 'airport'
            ? segment.destination.iataCode
            : undefined,
        }
      }
    }))
  },
  DataLists: {
    PassengerList: expandPassengers(passengers).map(p => ({
      Passenger: {
        PTC: p.type,
      }
    }))
  }
});
