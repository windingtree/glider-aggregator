const { transform } = require('camaro');
const axios = require('axios');
const {
  mapNdcRequestData_AF,
  mapNdcRequestData_AC
} = require('../transformInputData/searchOffers');
const {
  provideShoppingRequestTemplate_AF,
  provideShoppingRequestTemplate_AC
} = require('../soapTemplates/searchOffers');
const {
  provideAirShoppingTransformTemplate,
  ErrorsTransformTemplate
} = require('../camaroTemplates/provideAirShopping');
const {
  reduceToObjectByKey,
  roundCommissionDecimals,
  mergeHourAndDate,
  useDictionary,
  reduceObjectToProperty,
} = require('../parsers');

const {
  airFranceConfig,
  airCanadaConfig
} = require('../../config');

const GliderError = require('../error');
const offer = require('../models/offer');
const { selectProvider } = require('./utils/flightUtils');

// Make a call of the provider API
// @todo Add connection and response timeouts handling
const callProvider = async (provider, apiEndpoint, apiKey, ndcBody, SOAPAction) => {
  const response = await axios.post(
    apiEndpoint,
    ndcBody,
    {
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        'Accept-Encoding': 'gzip,deflate',
        'api_key': apiKey,
        ...(SOAPAction ? { SOAPAction } : {})
      },
    }
  )

  return {
    provider,
    response
  }
};

const transformResponse = async ({provider, response}) => {
  const searchResults = await transform(
    response.data,
    provideAirShoppingTransformTemplate
  );

  searchResults.itineraries.segments = mergeHourAndDate(
    searchResults.itineraries.segments,
    'splittedDepartureDate',
    'splittedDepartureTime',
    'departureTime'
  );
  searchResults.itineraries.segments = mergeHourAndDate(
    searchResults.itineraries.segments,
    'splittedArrivalDate',
    'splittedArrivalTime',
    'arrivalTime'
  );
  searchResults.itineraries.segments = reduceToObjectByKey(
    searchResults.itineraries.segments
  );

  // Walk through the flight list
  const combinations = {};
  searchResults.itineraries.combinations.forEach(flight => {
    combinations[flight._id_] = flight._items_.split(' ');
  });
  searchResults.itineraries.combinations = combinations;

  // Create the offers
  for (const offer of Object.values(searchResults.offers)) {
    // Add offer items
    offer.offerItems = reduceToObjectByKey(offer.offerItems);
    offer.offerItems = reduceObjectToProperty(offer.offerItems, '_value_');

    // Add the price plan references
    var pricePlansReferences = {};
    for (var flightsReference of offer.flightsReferences) {
      if (!pricePlansReferences[flightsReference.priceClassRef]) {
        pricePlansReferences[flightsReference.priceClassRef] = {
          'flights': [flightsReference.flightRef]
        };
      } else {
        pricePlansReferences[flightsReference.priceClassRef]
          .flights
          .push(flightsReference.flightRef);
      }
    }
    offer.pricePlansReferences = pricePlansReferences;
    delete(offer.flightsReferences);
  }

  searchResults.offers = roundCommissionDecimals(searchResults.offers);
  searchResults.offers = reduceToObjectByKey(searchResults.offers);
  searchResults.passengers = reduceToObjectByKey(searchResults.passengers);
  searchResults.checkedBaggages = reduceToObjectByKey(searchResults.checkedBaggages);
  searchResults.pricePlans = useDictionary(
    searchResults.pricePlans,
    searchResults.checkedBaggages,
    'checkedBaggages'
  );
  searchResults.pricePlans = reduceToObjectByKey(searchResults.pricePlans);
  
  // Store the offers
  var indexedOffers = {};
  for (let offerId in searchResults.offers) {
    indexedOffers[offerId] = new offer.FlightOffer(
      provider,
      provider,
      searchResults.offers[offerId].expiration,
      searchResults.offers[offerId].offerItems,
      searchResults.offers[offerId].price.public,
      searchResults.offers[offerId].price.currency
    );
  }

  await offer.offerManager.storeOffers(indexedOffers);

  delete searchResults.checkedBaggages;
  return searchResults;
};

const searchFlight = async (body) => {

  // Fetching of the flight providers
  // associated with the given origin and destination
  const providers = selectProvider(
    body.itinerary.segments[0].origin.iataCode,
    body.itinerary.segments[0].destination.iataCode
  );

  if (providers.length === 0) {
    throw new GliderError(
      'Flight providers not found for the given origin and destination',
      404
    );
  };

  // Request all providers
  const responses = await Promise.all(providers.map(provider => {
    let ndcRequestData;
    let providerUrl;
    let apiKey;
    let SOAPAction;
    let ndcBody;

    switch (provider) {
      case 'AF':
        ndcRequestData = mapNdcRequestData_AF(airFranceConfig, body);
        providerUrl = 'https://ndc-rct.airfranceklm.com/passenger/distribmgmt/001448v01/EXT';
        apiKey = airFranceConfig.apiKey;
        SOAPAction = '"http://www.af-klm.com/services/passenger/ProvideAirShopping/provideAirShopping"';
        ndcBody = provideShoppingRequestTemplate_AF(ndcRequestData);
        break;
      case 'AC':
        ndcRequestData = mapNdcRequestData_AC(airCanadaConfig, body);
        providerUrl = 'https://ndchub.mconnect.aero/messaging/v2/ndc-exchange/AirShopping';
        apiKey = airCanadaConfig.apiKey;
        ndcBody = provideShoppingRequestTemplate_AC(ndcRequestData);
        break;
      default:
        Promise.reject('Unsupported flight operator');
    }

    console.log(ndcBody);

    return callProvider(provider, providerUrl, apiKey, ndcBody, SOAPAction);
  }));

  // Check responses for errors
  const responseErrors = await Promise.all(
    responses
      .map(async (r) => {

        if (r.response instanceof Error) {

          // Request error
          return {
            provider: r.provider,
            error: r.message
          };
        }

        try {
          const { errors } = await transform(r.response.data, ErrorsTransformTemplate);

          if (errors.length) {

            // Response errors
            return {
              provider: r.provider,
              error: errors.map(e => e.message).join('; ')
            };
          } else {
            return null;
          }
        } catch (e) {

          // Transformation error
          return {
            provider: r.provider,
            error: e.message
          };
        }
      })
  )
    .filter(e => e !== null);
  
  let searchResult = {};

  if (responseErrors.length === providers.length) {
    // If all providers returned errors
    // then send error with API response
    throw new GliderError(
      responseErrors.map(e => `Provider "${e.provider}": ${e.error}`).join('; '),
      502
    );
  } else if (responseErrors.length > 0) {
    // If at least one provider returned offers
    // then pul all errors to the warnings section
    searchResult.warnings = responseErrors;
  }

  const transformedResponses = await Promise.all(
    responses
      .filter(r => !r.error)// Exclude errors
      .map(
        r => transformResponse(r)
      )
  );

  console.log('Responses:', JSON.stringify(transformedResponses, null, 2));
  
};

module.exports = {
  searchFlight,
};
