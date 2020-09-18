// eslint-disable-next-line no-unused-vars
const createSearchRequest = (location, departure, arrival, guests) => {
  //TODO remove hardcoded radius
  let request = {
    latitude: location.lat, longitude: location.long, radius: 30, radiusUnit: 'KM',
    currency: 'EUR',
    bestRateOnly: false,
    lang: 'EN',
  };
  return request;
};


module.exports = { createSearchRequest: createSearchRequest };
