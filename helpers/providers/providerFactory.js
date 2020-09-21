const FlightSearchACClient = require('./flights/ac/flightProviderAC');
const FlightSearchAFClient = require('./flights/af/flightProviderAF');
const FlightSearchAmadeusClient = require('./flights/amadeus/flightProvider1A');
const HotelProviderRevMax = require('./hotels/erevmax/hotelProviderRevMax');
const HotelProviderRevMaxSimulator = require('./hotels/simulator/hotelProviderRevMaxSimulator');
const HotelProviderAmadeus = require('./hotels/amadeus/hotelProviderAmadeus');
const GliderError = require('../error');

/**
 * Factory to instantiate flight provider based on providerID
 * @param providerId ID of the flight provider
 * @returns instance of a subclass of FlightProvider - implementation of flight provider
 */
const createFlightProvider = (providerId) => {
  let providerImpl;
  switch (providerId) {
    case 'AF':
      providerImpl = new FlightSearchAFClient();
      break;
    case 'AC':
      providerImpl = new FlightSearchACClient();
      break;
    case '1A':
      providerImpl = new FlightSearchAmadeusClient();
      break;
    default:
      throw new GliderError(`Unknown flight provider ${providerId}`, 500);
  }
  return providerImpl;
};

/**
 * Same as #createFlightProvider but takes an array of providerIDs as a parameter and returns array of flight providers
 * @param providerIDs
 * @returns [] array of instances of FlightProvider implementations
 */
const createFlightProviders = (providerIDs) => {
  return providerIDs.map(providerID => {
    let providerImpl = createFlightProvider(providerID);
    return providerImpl;
  });
};


/**
 * Factory to instantiate hotels provider based on providerID
 * @param providerId ID of the hotel provider
 * @returns instance of a subclass of HotelProvider - implementation of hotels provider
 */
const createHotelProvider = (providerId) => {
  let providerImpl;
  switch (providerId) {
    case 'revmax':
      providerImpl = new HotelProviderRevMax();
      break;
    case '1A':
      providerImpl = new HotelProviderAmadeus();
      break;
    case 'revmax-simulator':
      providerImpl = new HotelProviderRevMaxSimulator();
      break;
    default:
      throw new GliderError(`Unknown hotels provider ${providerId}`, 500);
  }
  return providerImpl;
};

/**
 * Same as #createHotelProvider but takes an array of providerIDs as a parameter and returns array of hotel providers
 * @param providerIDs
 * @returns [] array of instances of HotelProvider implementations
 */
const createHotelProviders = (providerIDs) => {
  return providerIDs.map(providerID => {
    let providerImpl = createHotelProvider(providerID);
    return providerImpl;
  });
};




module.exports = {
  createFlightProviders: createFlightProviders,
  createFlightProvider: createFlightProvider,
  createHotelProvider: createHotelProvider,
  createHotelProviders: createHotelProviders,
};
