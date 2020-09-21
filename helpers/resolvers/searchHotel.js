const { createHotelProviders } = require('../providers/providerFactory');
const GliderError = require('../error');
const { deepMerge } = require('../parsers');

module.exports.searchHotel = async (body) => {
  if (!body.passengers || !body.passengers.length) {
    throw new GliderError('Missing passenger types', 400);
  }

  const { accommodation, passengers: guests } = body;
  let context = {};

  let providerHandlers = createHotelProviders(['revmax']);

  //search for hotels with each provider and collect responses (each response is having following structure: {provider, response, errors}
  let responses = await Promise.all(providerHandlers.map(async providerImpl => {
    let result = {
      provider: providerImpl.getProviderID(),
      response: undefined,
      error: undefined,
    };
    try {
      result.response = await providerImpl.search(context, accommodation, guests);
    } catch (error) {
      result.error = error;
    }
    return result;
  }));

  // Check responses for errors
  const responseErrors = responses.map(({ provider, error }) => {
    if (error) {
      return {
        provider: provider,
        error: error.message,
      };
    } else {
      return null;
    }
  }).filter(e => e !== null);


  let searchResult = {};

  if (responseErrors.length === providerHandlers.length) {
    // If all providers returned errors then send error with API response
    throw new GliderError(responseErrors.map(e => `Provider [${e.provider}]: ${e.error}`).join('; '), 502);
  } else if (responseErrors.length > 0) {
    // If at least one provider returned offers
    // then pul all errors to the warnings section
    searchResult.warnings = responseErrors;
  }

  responses = responses.filter(r => !r.error).map(r => r.response);// Exclude errors and extract search results
  const finalResults = responses.reduce((a, v) => deepMerge(a, v), searchResult);
  finalResults.passengers = {
    PAX1: {
      type: 'ADT',
    },
  };
  return finalResults;
};
