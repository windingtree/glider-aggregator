const { FlightProviderAC } = require('./flights/ac/flightProviderAC');
const { FlightProviderAF } = require('./flights/af/flightProviderAF');
const { FlightProvider1A } = require('./flights/amadeus/flightProvider1A');
const { HotelProviderRevMax } = require('./hotels/erevmax/hotelProviderRevMax');
const { HotelProviderRevMaxSimulator } = require('./hotels/simulator/hotelProviderRevMaxSimulator');
const { HotelProviderAmadeus } = require('./hotels/amadeus/hotelProviderAmadeus');
const caDestinations = require('./cadest.json');
const config = require('../../config');
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
      providerImpl = new FlightProviderAF();
      break;
    case 'AC':
      providerImpl = new FlightProviderAC();
      break;
    case 'AMADEUS':
      providerImpl = new FlightProvider1A();
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
    case 'EREVMAX':
      providerImpl = new HotelProviderRevMax();
      break;
    case 'AMADEUS':
      providerImpl = new HotelProviderAmadeus();
      break;
    case 'EREVMAX-SIMULATOR':
      providerImpl = new HotelProviderRevMaxSimulator();
      break;
    default:
      throw new GliderError(`Unknown hotels provider ${providerId}`, 500);
  }
  return providerImpl;
};

/**revmax
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



const getACDestinations = () => {
  return caDestinations;
};

const get1ADestinations = () => {
  return caDestinations;
};

/**
 * Find which flight providers should be used for a given origin&destination.
 * Takes into account which providers are enabled/disabled (by business rules)
 */
const selectProvider = (origin, destination) => {
  origin = Array.isArray(origin) ? origin : [origin];
  destination = Array.isArray(destination) ? destination : [destination];

  const sdMapping = [
    {
      provider: 'AMADEUS',
      destinations: get1ADestinations(),
    },
    {
      provider: 'AC',
      destinations: getACDestinations(),
    },
  ];

  let providers = sdMapping
    .reduce((a, v) => {

      if (
        (v.destinations.filter(d => origin.includes(d)).length > 0 ||
          v.destinations.filter(d => destination.includes(d)).length > 0) &&
        !a.includes(v.provider)
      ) {
        a.push(v.provider);
      }

      return a;
    }, []);// temporary until we do not have a specific set for AF - ['AF']

  //of those providers that were found, only use those that are specified by business rules/feature flag
  let enabledFlightProviders = config.getConfigKeyAsArray('flights.providers', []);

  providers = providers.filter(provider => enabledFlightProviders.includes(provider));
  return providers;
};


module.exports = {
  createFlightProviders,
  createFlightProvider,
  createHotelProvider,
  createHotelProviders,
  selectProvider
};
