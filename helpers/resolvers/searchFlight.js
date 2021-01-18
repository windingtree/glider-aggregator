const { v4: uuidv4 } = require('uuid');
const providerFactory = require('../providers/providerFactory');
const {
  reduceToObjectByKey,
  roundCommissionDecimals,
  mergeHourAndDate,
  useDictionary,
  reduceObjectToProperty,
  deepMerge,
} = require('../parsers');

const GliderError = require('../error');
const offerModel = require('../models/offer');
const { logRQRS } = require('../log/logRQ');

const transformResponse = async (
  { provider, response: searchResults }, passengersIds,
) => {
  if (provider !== 'AMADEUS') {
    searchResults.itineraries.segments = mergeHourAndDate(searchResults.itineraries.segments);
  }

  searchResults.itineraries.segments = reduceToObjectByKey(searchResults.itineraries.segments);

  // Walk through the flight list
  const combinations = {};
  searchResults.itineraries.combinations.forEach(flight => {
    combinations[flight._id_] = flight._items_.split(' ');
  });
  searchResults.itineraries.combinations = combinations;

  const mappedPassengers = {};
  const mappedPassengersReverse = {};
  // Create the offers
  for (const offer of Object.values(searchResults.offers)) {
    // Add offer items
    offer.offerItems = reduceToObjectByKey(offer.offerItems);
    offer.offerItems = reduceObjectToProperty(offer.offerItems, '_value_');

    let flattenedPassengerIds = flattenPassengerTypesMap(passengersIds);
    for (const item in offer.offerItems) {
      const refs = offer
        .offerItems[item]
        .passengerReferences
        .split(' ')
        .map(r => {
          for (const p in searchResults.passengers) {
            const passenger = searchResults.passengers[p];
            if (r === passenger._id_) {
              let paxType = passenger.type;
              //find corresponding entry in flattenedPassengerIds
              let mappedPassenger = undefined;
              for (let flatIdx = 0; flatIdx < flattenedPassengerIds.length; flatIdx++) {
                if (flattenedPassengerIds[flatIdx].type === paxType) {
                  mappedPassenger = flattenedPassengerIds.splice(flatIdx, 1)[0];
                  break;
                }
              }
              if (!mappedPassenger)
                throw new GliderError(`Cannot map passenger from search results to request, _id_:${passenger._id_}, type:${passenger.type}`);
              mappedPassengers[mappedPassenger.id] = r;
              mappedPassengersReverse[r] = mappedPassenger.id;
              return mappedPassenger.id;
            }
          }
        });
      offer.offerItems[item].passengerReferences = refs.join(' ');
    }

    // Add the price plan references
    if (offer.flightsReferences) {
      var pricePlansReferences = {};
      for (var flightsReference of offer.flightsReferences) {

        if (!pricePlansReferences[flightsReference.priceClassRef]) {
          pricePlansReferences[flightsReference.priceClassRef] = {
            'flights': [flightsReference.flightRef],
          };
        } else {
          pricePlansReferences[flightsReference.priceClassRef]
            .flights
            .push(flightsReference.flightRef);
        }
      }
      offer.pricePlansReferences = pricePlansReferences;
      delete (offer.flightsReferences);
    } else if (offer.pricePlansReferences) {

      for (const priceRef of offer.pricePlansReferences) {
        priceRef.flights = priceRef.flights.split(' ');
      }

      offer.pricePlansReferences = reduceToObjectByKey(offer.pricePlansReferences);
    }
  }

  searchResults.offers = roundCommissionDecimals(searchResults.offers);
  searchResults.offers = reduceToObjectByKey(searchResults.offers);
  searchResults.passengers = reduceToObjectByKey(
    searchResults.passengers.map(p => ({
      '_id_': mappedPassengersReverse[p._id_],
      type: p.type,
    })),
  );

  if (searchResults.checkedBaggages) {
    searchResults.checkedBaggages = reduceToObjectByKey(searchResults.checkedBaggages);
    searchResults.pricePlans = useDictionary(
      searchResults.pricePlans,
      searchResults.checkedBaggages,
      'checkedBaggages',
    );
  }

  searchResults.pricePlans = reduceToObjectByKey(searchResults.pricePlans);

  for (const plan in searchResults.pricePlans) {

    if (!searchResults.pricePlans[plan].checkedBaggages &&
      searchResults.pricePlans[plan].amenities) {

      if (searchResults.pricePlans[plan].amenities.includes('Checked bags for a fee')) {
        searchResults.pricePlans[plan].checkedBaggages = {
          quantity: 0,
        };
      } else if (searchResults.pricePlans[plan].amenities.includes('1st checked bag free')) {
        searchResults.pricePlans[plan].checkedBaggages = {
          quantity: 1,
        };
      } else if (
        searchResults.pricePlans[plan].amenities.includes('2 checked bags free') ||
        searchResults.pricePlans[plan].amenities.includes('2 checked bags for a fee')) {
        searchResults.pricePlans[plan].checkedBaggages = {
          quantity: 2,
        };
      }
    }
  }

  if (searchResults.destinations) {
    searchResults.destinations = reduceToObjectByKey(searchResults.destinations);
  }

  let overriddenOffers = {};

  // Store the offers
  let indexedOffers = {};
  let expirationDate = new Date(Date.now() + 60 * 30 * 1000).toISOString();// now + 30 min

  // Process offers
  for (let offerId in searchResults.offers) {

    if (searchResults.offers[offerId].expiration === '') {
      searchResults.offers[offerId].expiration = expirationDate;
    }

    // Fix Date ISO string format if missed (actual for AF offers)
    if (!searchResults.offers[offerId].expiration.match(/Z$/)) {
      searchResults.offers[offerId].expiration = searchResults.offers[offerId].expiration + 'Z';
    }

    if (provider === 'AC') {
      let segments;
      let destinations;

      // Extract segments and destinations associated with the offer
      for (const pricePlanId in searchResults.offers[offerId].pricePlansReferences) {
        const pricePlan = searchResults.offers[offerId].pricePlansReferences[pricePlanId];

        for (const flight of pricePlan.flights) {

          // Build plans refs with deduplicated flights
          const pricePlansRefsOverride = {
            [pricePlanId]: {
              flights: [flight],
            },
          };

          // Get the associated combinations associated with the flight
          segments = searchResults.itineraries.combinations[flight].map(c => {
            const segment = searchResults.itineraries.segments[c];
            const operator = segment.operator;
            operator.iataCode = operator.iataCode ? operator.iataCode : operator.iataCodeM;
            operator.flightNumber =
              `${operator.iataCodeM}${String(operator.flightNumber).padStart(4, '0')}`;
            delete operator.iataCodeM;
            if (segment.Departure.Terminal.Name === '') {
              delete segment.Departure.Terminal;
            }
            if (segment.Arrival.Terminal.Name === '') {
              delete segment.Arrival.Terminal;
            }
            segment.aggregationKey =
              `${provider}${operator.flightNumber}${segment.departureTime}${segment.arrivalTime}`;
            return {
              id: c,
              ...segment,
            };
          });

          // Get associated destination associated with the flight
          destinations = [
            {
              id: flight,
              ...searchResults.destinations[flight],
            },
          ];

          // Create extended set of AirCanada offers
          const splittedOfferId = uuidv4();
          overriddenOffers[splittedOfferId] = JSON.parse(JSON.stringify(searchResults.offers[offerId]));
          overriddenOffers[splittedOfferId].pricePlansReferences = pricePlansRefsOverride;
          overriddenOffers[splittedOfferId].extraData = {
            offerId,
            segments,
            destinations,
            passengers: passengersIds,
            mappedPassengers,
          };
        }
      }
    }
    if (provider === 'AF') {
      // AirFrance offers
      searchResults.offers[offerId].extraData = {
        passengers: passengersIds,
        mappedPassengers,
      };
    }
    if (provider === 'AMADEUS') {
      searchResults.offers[offerId].extraData = {
        rawOffer: searchResults.offers[offerId].extraData.rawOffer,
        segments: searchResults.offers[offerId].extraData.segments,
        passengers: passengersIds,
        mappedPassengers,
      };
    }
  }

  if (provider === 'AF') {
    for (const segmentId in searchResults.itineraries.segments) {
      const segment = searchResults.itineraries.segments[segmentId];
      const operator = segment.operator;
      operator.iataCode = operator.iataCode ? operator.iataCode : operator.iataCodeM;
      operator.flightNumber =
        `${operator.iataCodeM}${String(operator.flightNumber).padStart(4, '0')}`;
      delete operator.iataCodeM;
    }
  }

  // Rewrite whole search results object by adding splitted offers
  if (Object.keys(overriddenOffers).length > 0) {
    searchResults.offers = overriddenOffers;
  }

  const combinationsMap = {};

  // Deduplicate AirCanada segments and flights
  if (provider === 'AC') {
    // Segments aggregation
    const aggregatedSegments = {};
    const aggregationKeys = {}; // Mapping of unique aggregationKeys to SegmentsIds
    const segmentsMap = {};

    for (const origSegmentId in searchResults.itineraries.segments) {
      const segment = searchResults.itineraries.segments[origSegmentId];

      if (aggregationKeys[segment.aggregationKey]) {
        segmentsMap[origSegmentId] = aggregationKeys[segment.aggregationKey];
      } else {
        aggregatedSegments[origSegmentId] = segment;
        aggregationKeys[segment.aggregationKey] = origSegmentId;
      }
      delete segment.aggregationKey;
    }
    searchResults.itineraries.segments = aggregatedSegments;

    const updatedCombinations = {};
    const combinationsKeys = {};

    for (const c in searchResults.itineraries.combinations) {
      let combination = searchResults.itineraries.combinations[c];
      updatedCombinations[c] = combination.map(
        segmentId => segmentsMap[segmentId]
          ? segmentsMap[segmentId]
          : segmentId,
      );
      combinationsKeys[c] = updatedCombinations[c].join('');
    }
    searchResults.itineraries.combinations = updatedCombinations;

    // Flights aggregation
    const aggregatedCombinations = {};
    const aggregatedCombinationsKeys = {};

    for (const origCombinationId in searchResults.itineraries.combinations) {
      let combination = searchResults.itineraries.combinations[origCombinationId];

      if (aggregatedCombinationsKeys[updatedCombinations[origCombinationId]]) {
        combinationsMap[origCombinationId] = aggregatedCombinationsKeys[updatedCombinations[origCombinationId]];
      } else {
        aggregatedCombinations[origCombinationId] = combination;
        aggregatedCombinationsKeys[updatedCombinations[origCombinationId]] = origCombinationId;
      }
    }
    ;
    searchResults.itineraries.combinations = aggregatedCombinations;
  }

  // Prepare offers for storing to the database
  for (const offerId in searchResults.offers) {
    const offer = searchResults.offers[offerId];

    // Update aggregated flights
    if (Object.keys(combinationsMap).length > 0) {
      for (const pricePlanId in offer.pricePlansReferences) {
        const flights = offer.pricePlansReferences[pricePlanId].flights;
        offer.pricePlansReferences[pricePlanId].flights = flights.map(
          flight => combinationsMap[flight]
            ? combinationsMap[flight]
            : flight,
        );
      }
    }

    indexedOffers[offerId] = new offerModel.FlightOffer(
      provider,
      provider,
      searchResults.offers[offerId].expiration,
      searchResults.offers[offerId].offerItems,
      searchResults.offers[offerId].price.public,
      searchResults.offers[offerId].price.currency,
      searchResults.offers[offerId].extraData,
    );

    delete searchResults.offers[offerId].offerItems;
    delete searchResults.offers[offerId].extraData;
  }
  // Store offers to the database
  await offerModel.offerManager.storeOffers(indexedOffers);

  // Cleanup search results from supporting information
  delete searchResults.checkedBaggages;
  delete searchResults.destinations;

  for (const segment in searchResults.itineraries.segments) {
    delete searchResults.itineraries.segments[segment].Departure;
    delete searchResults.itineraries.segments[segment].Arrival;
    delete searchResults.itineraries.segments[segment].MarketingCarrier;
    delete searchResults.itineraries.segments[segment].OperatingCarrier;
    delete searchResults.itineraries.segments[segment].Equipment;
    delete searchResults.itineraries.segments[segment].ClassOfService;
    delete searchResults.itineraries.segments[segment].FlightDetail;
  }

  return searchResults;
};


//convert {"ADT":["X","934A5B09"],"CHD":["1772C7D1"]};
//to  [{ type: 'ADT', id: 'X' },{ type: 'ADT', id: 'Y' },{ type: 'CHD', id: 'Z' }]
const flattenPassengerTypesMap = (paxTypesMap) => {
  let result = [];
  for (const [passengerType, passengerIds] of Object.entries(paxTypesMap)) {
    let allPaxIdentifiersOfType = passengerIds.map(paxId => {
      return { type: passengerType, id: paxId };
    });
    result.push(...allPaxIdentifiersOfType);
  }
  return result;
};


module.exports.searchFlight = async (body) => {
  logRQRS(body, 'search criteria');
  // Fetching of the flight providers
  // associated with the given origin and destination
  const providers = providerFactory.selectProvider(
    body.itinerary.segments[0].origin.iataCode,
    body.itinerary.segments[0].destination.iataCode,
  );
  if (providers.length === 0) {
    throw new GliderError('Flight providers not found for the given origin and destination', 404);
  }
  let providerHandlers = providerFactory.createFlightProviders(providers);
  if (providers.length !== providerHandlers.length) {
    //TODO improve handling of unknown providers/implementations
    throw new GliderError('Missing provider configuraton/implementation', 404);
  }
  const { itinerary, passengers } = body;
  // Request all providers

  const responses = await Promise.all(providerHandlers.map(async providerImpl => {
    let result = {
      provider: providerImpl.getProviderID(),
      response: undefined,
      error: undefined,
    };
    try {
      result.response = await providerImpl.flightSearch(itinerary, passengers);
      console.log(`Search completed for ${providerImpl.getProviderID()}`);
      logRQRS(result.response, 'raw_response', providerImpl.getProviderID());
    } catch (error) {
      console.log(`Search failed for ${providerImpl.getProviderID()}, code:${error.code}, message:${error.message}`);
      result.error = error;
    }
    return result;
  }));
  // Check responses for errors
  const responseErrors = (await Promise.all(
    responses.map(({ provider, error }) => {
      if (error) {
        return {
          provider:provider,
          error: error.message,
        };
      } else {
        return null;
      }
    }),
  ))
    .filter(e => e !== null);

  let searchResult = {};
  if (responseErrors.length === providers.length) {
    // If all providers returned errors then send error with API response
    throw new GliderError(responseErrors.map(e => `Provider [${e.provider}]: ${e.error}`).join('; '), 502);
  } else if (responseErrors.length > 0) {
    // If at least one provider returned offers then put all errors to the warnings section
    searchResult.warnings = responseErrors;
  }
  // Build mapped passengers by types
  const passengersIds = body.passengers.reduce(
    (a, v) => {
      if (!v.count) {
        v.count = 1;
      }
      if (!a[v.type]) {
        a[v.type] = [];
      }
      for (let i = 0; i < v.count; i++) {
        a[v.type].push(uuidv4().split('-')[0].toUpperCase());
      }
      return a;
    },
    {},
  );
  const transformedResponses = await Promise.all(
    responses
      .filter(r => !r.error)// Exclude errors
      .map(
        r => transformResponse(r, passengersIds),
      ),
  );

  let finalResult =  transformedResponses.reduce((a, v) => deepMerge(a, v), searchResult);
  logRQRS(finalResult, 'search response');
  return finalResult;
};


