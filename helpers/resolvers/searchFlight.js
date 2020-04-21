const { transform } = require('camaro');
const { v4: uuidv4 } = require('uuid');
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
  ErrorsTransformTemplate_AF,
  ErrorsTransformTemplate_AC,
  FaultsTransformTemplate_AC
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
const { selectProvider, callProvider } = require('./utils/flightUtils');

const transformResponse = async ({ provider, response }, transformTemplate) => {
  
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
      } else if (
        searchResults.pricePlans[plan].amenities.includes('2 checked bags free') ||
        searchResults.pricePlans[plan].amenities.includes('2 checked bags for a fee')) {
        searchResults.pricePlans[plan].checkedBaggages = 2;
      }
    }
  }

  if (searchResults.destinations) {
    searchResults.destinations = reduceToObjectByKey(searchResults.destinations);
  }
  
  // Store the offers
  let indexedOffers = {};
  let overriddenOffers = {};
  let expirationDate = new Date(Date.now() + 60 * 30 * 1000).toISOString();// now + 30 min
  
  for (let offerId in searchResults.offers) {

    if (searchResults.offers[offerId].expiration === '') {
      searchResults.offers[offerId].expiration = expirationDate;
    }

    if (provider === 'AC') {
      let segments;
      let destinations;
      let extraData = {};
      
      // Extract proper segments associated with the offer
      for (const pricePlanId in searchResults.offers[offerId].pricePlansReferences) {
        const pricePlan = searchResults.offers[offerId].pricePlansReferences[pricePlanId];

        for (const flight of pricePlan.flights) {

          // Build plans refs with deduplicated flights
          const pricePlansRefsOverride = {
            [pricePlanId]: {
              flights: [flight]
            }
          };

          // Get the associated combinations associated with the flight
          segments = searchResults.itineraries.combinations[flight].map(c => {
            if (searchResults.itineraries.segments[c].Departure.Terminal.Name === '') {
              delete searchResults.itineraries.segments[c].Departure.Terminal;
            }
            if (searchResults.itineraries.segments[c].Arrival.Terminal.Name === '') {
              delete searchResults.itineraries.segments[c].Arrival.Terminal;
            }
            const segment = {
              id: c,
              ...searchResults.itineraries.segments[c]
            };
            return segment;
          });

          // Get associated destination associated with the flight
          destinations = [
            {
              id: flight,
              ...searchResults.destinations[flight]
            }
          ];

          // Save each flight offer (from the set of flights) as separate offer
          const splittedOfferId = uuidv4();
          indexedOffers[splittedOfferId] = new offer.FlightOffer(
            provider,
            provider,
            searchResults.offers[offerId].expiration,
            searchResults.offers[offerId].offerItems,
            searchResults.offers[offerId].price.public,
            searchResults.offers[offerId].price.currency,
            {
              offerId,
              segments,
              destinations
            }
          );
          
          // Assign cloned offer to avoid offer mutability
          overriddenOffers[splittedOfferId] = JSON.parse(JSON.stringify(searchResults.offers[offerId]));
          overriddenOffers[splittedOfferId].pricePlansReferences = pricePlansRefsOverride;
        }
      }
      
    } else {

      indexedOffers[offerId] = new offer.FlightOffer(
        provider,
        provider,
        searchResults.offers[offerId].expiration,
        searchResults.offers[offerId].offerItems,
        searchResults.offers[offerId].price.public,
        searchResults.offers[offerId].price.currency
      );
    }
  }

  // Rewrite whole search results object by adding splitted offers
  if (overriddenOffers) {
    searchResults.offers = overriddenOffers;
  }
  
  await offer.offerManager.storeOffers(indexedOffers);

  // Remove helpers segments information from results
  for (const segment in searchResults.itineraries.segments) {
    delete searchResults.itineraries.segments[segment].Departure;
    delete searchResults.itineraries.segments[segment].Arrival;
    delete searchResults.itineraries.segments[segment].MarketingCarrier;
    delete searchResults.itineraries.segments[segment].OperatingCarrier;
    delete searchResults.itineraries.segments[segment].Equipment;
    delete searchResults.itineraries.segments[segment].ClassOfService;
    delete searchResults.itineraries.segments[segment].FlightDetail;
  }

  delete searchResults.checkedBaggages;
  delete searchResults.destinations;
  return searchResults;
};

module.exports.searchFlight = async (body) => {

  let responseTransformTemplate;
  let errorsTransformTemplate;

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
        errorsTransformTemplate = ErrorsTransformTemplate_AF;
        faultsTransformTemplate = null;
        break;
      case 'AC':
        ndcRequestData = mapNdcRequestData_AC(airCanadaConfig, body);
        providerUrl = 'https://ndchub.mconnect.aero/messaging/v2/ndc-exchange/AirShopping';
        apiKey = airCanadaConfig.apiKey;
        ndcBody = provideShoppingRequestTemplate_AC(ndcRequestData);
        responseTransformTemplate = provideAirShoppingTransformTemplate_AC;
        errorsTransformTemplate = ErrorsTransformTemplate_AC;
        faultsTransformTemplate = FaultsTransformTemplate_AC;
        break;
      default:
        return Promise.reject('Unsupported flight operator');
    }

    return callProvider(provider, providerUrl, apiKey, ndcBody, SOAPAction);
  }));

  // Check responses for errors
  const responseErrors = (await Promise.all(
    responses
      .map(async (r) => {
        
        if (r.error && !r.error.isAxiosError) {

          // Request error
          return {
            provider: r.provider,
            error: r.error instanceof Error ? r.error.message : r.error
          };
        }

        try {
          let faultsResult;

          if (faultsTransformTemplate) {
            faultsResult = await transform(
              r.response.data,
              faultsTransformTemplate
            );
          }

          const errorsResult = await transform(
            r.response.data,errorsTransformTemplate
          );

          // Because of two types of errors can be returned: NDCMSG_Fault and Errors
          const combinedErrors = [
            ...(faultsResult ? faultsResult.errors : []),
            ...errorsResult.errors
          ];

          if (combinedErrors.length) {
            return {
              provider: r.provider,
              error: combinedErrors.map(e => e.message).join('; ')
            };
          } else if (r.error) {
            return {
              provider: r.provider,
              error: r.error.message
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
