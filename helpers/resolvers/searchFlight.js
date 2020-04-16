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
  provideAirShoppingTransformTemplate_AF,
  provideAirShoppingTransformTemplate_AC,
  ErrorsTransformTemplate
} = require('../camaroTemplates/provideAirShopping');
const {
  reduceToObjectByKey,
  roundCommissionDecimals,
  mergeHourAndDate,
  useDictionary,
  reduceObjectToProperty,
  deepMerge
} = require('../parsers');

const {
  airFranceConfig,
  airCanadaConfig
} = require('../../config');

const GliderError = require('../error');
const offer = require('../models/offer');
const { selectProvider } = require('./utils/flightUtils');

// Make a call of the provider API
const callProvider = async (provider, apiEndpoint, apiKey, ndcBody, SOAPAction) => {
  let response;

  try {
    // Request timeouts can be handled via CancelToken only
    const timeout = 60 * 1000; // 60 sec
    const source = axios.CancelToken.source();
    const connectionTimeout = setTimeout(() => source.cancel(
        `Cannot connect to the source: ${uri}`
    ), timeout);// connection timeout
    
    response = await axios.post(
      apiEndpoint,
      ndcBody,
      {
        headers: {
          'Content-Type': 'application/xml;charset=UTF-8',
          'Accept-Encoding': 'gzip,deflate',
          'Cache-Control': 'no-cache',
          'api_key': apiKey,
          'X-apiKey': apiKey,
          ...(SOAPAction ? { SOAPAction } : {})
        },
        cancelToken: source.token, // Request timeout
        timeout // Response timeout
      }
    );

    clearTimeout(connectionTimeout);
  } catch (error) {
    return {
      provider,
      error
    };
  }

  return {
    provider,
    response
  }
};

const transformResponse = async ({provider, response}, transformTemplate) => {
  
  const searchResults = await transform(
    response.data,
    transformTemplate
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
    if (offer.flightsReferences) {
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
    } else if (offer.pricePlansReferences) {
      
      for (const priceRef of offer.pricePlansReferences) {
        priceRef.flights = priceRef.flights.split(' ');
      }

      offer.pricePlansReferences = reduceToObjectByKey(offer.pricePlansReferences);
    }    
  }

  searchResults.offers = roundCommissionDecimals(searchResults.offers);
  searchResults.offers = reduceToObjectByKey(searchResults.offers);
  searchResults.passengers = reduceToObjectByKey(searchResults.passengers);
  
  if (searchResults.checkedBaggages) {
    searchResults.checkedBaggages = reduceToObjectByKey(searchResults.checkedBaggages);
    searchResults.pricePlans = useDictionary(
      searchResults.pricePlans,
      searchResults.checkedBaggages,
      'checkedBaggages'
    );  
  }

  searchResults.pricePlans = reduceToObjectByKey(searchResults.pricePlans);

  for (const plan in searchResults.pricePlans) {

    if (!searchResults.pricePlans[plan].checkedBaggages &&
        searchResults.pricePlans[plan].amenities) {
      
      if (searchResults.pricePlans[plan].amenities.includes('Checked bags for a fee')) {
        searchResults.pricePlans[plan].checkedBaggages = 0;
      } else if (searchResults.pricePlans[plan].amenities.includes('1st checked bag free')) {
        searchResults.pricePlans[plan].checkedBaggages = 1;
      } else if (searchResults.pricePlans[plan].amenities.includes('2 checked bags free')) {
        searchResults.pricePlans[plan].checkedBaggages = 2;
      }
    }
  }
  
  // Store the offers
  let indexedOffers = {};
  let expirationDate = new Date(Date.now() + 60 * 30 * 1000).toISOString();// now + 30 min
  
  for (let offerId in searchResults.offers) {

    if (searchResults.offers[offerId].expiration === '') {
      searchResults.offers[offerId].expiration = expirationDate; 
    }

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

  let responseTransformTemplate;

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
        responseTransformTemplate = provideAirShoppingTransformTemplate_AF;
        break;
      case 'AC':
        ndcRequestData = mapNdcRequestData_AC(airCanadaConfig, body);
        providerUrl = 'https://ndchub.mconnect.aero/messaging/v2/ndc-exchange/AirShopping';
        apiKey = airCanadaConfig.apiKey;
        ndcBody = provideShoppingRequestTemplate_AC(ndcRequestData);
        responseTransformTemplate = provideAirShoppingTransformTemplate_AC;
        break;
      default:
        Promise.reject('Unsupported flight operator');
    }

    return callProvider(provider, providerUrl, apiKey, ndcBody, SOAPAction);
  }));

  // Check responses for errors
  const responseErrors = (await Promise.all(
    responses
      .map(async (r) => {

        if (r.error) {

          // Request error
          return {
            provider: r.provider,
            error: r.error instanceof Error ? r.error.message : r.error
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
  ))
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
        r => transformResponse(r, responseTransformTemplate)
      )
  );

  return transformedResponses.reduce((a, v) => deepMerge(a, v), searchResult);
};

module.exports.searchFlight = searchFlight;
