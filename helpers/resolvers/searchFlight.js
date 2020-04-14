const { transform } = require('camaro');
const axios = require('axios');
const { mapNdcRequestData } = require('../transformInputData/searchOffers');
const { provideAirShoppingRequestTemplate } = require('../soapTemplates/searchOffers');
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

const selectResolver = (origin, destination) => {
  const sdMapping = [
    {
      air: 'ac',
      origin: ['YQQ'],
      destination: ['YXU'],
      area: 'CA'
    },
    {
      air: 'ac',
      origin: ['YTO'],
      destination: ['YVR'],
      area: 'CA'
    },
    {
      air: 'ac',
      origin: ['YMM'],
      destination: ['YXU', 'YYT'],
      area: 'CA'
    },
    {
      air: 'ac',
      origin: ['YHZ'],
      destination: ['YQR', 'YYJ'],
      area: 'CA'
    },
    {
      air: 'ac',
      origin: ['YEA'],
      destination: ['YXE', 'YYC', 'YZR'],
      area: 'CA'
    },
    {
      air: 'ac',
      origin: ['YYC'],
      destination: ['YVR', 'YWG', 'YYT', 'YTO'],
      area: 'CA'
    },
    {
      air: 'ac',
      origin: ['YMQ'],
      destination: ['YVR', 'YWG', 'YYT', 'YTO'],
      area: 'CA'
    },
    {
      air: 'ac',
      origin: ['YOB'],
      destination: ['LAS'],
      area: 'US'
    },
    {
      air: 'ac',
      origin: ['YWG'],
      destination: ['DEN', 'STL'],
      area: 'US'
    },
    {
      air: 'ac',
      origin: ['YVR'],
      destination: ['CHI', 'LAS', 'LAX'],
      area: 'US'
    },
    {
      air: 'ac',
      origin: ['YTO'],
      destination: ['CHI', 'DFW', 'FLL', 'LAX'],
      area: 'US'
    },
    {
      air: 'ac',
      origin: ['YMQ'],
      destination: ['BOS', 'CHI', 'DEN', 'LAS', 'LAX', 'SFO'],
      area: 'US'
    },
    {
      air: 'ac',
      origin: ['YVR'],
      destination: ['SIN'],
      area: 'PA'
    },
    {
      air: 'ac',
      origin: ['YVR'],
      destination: ['BKK'],
      area: 'PA'
    },
    {
      air: 'ac',
      origin: ['YVR'],
      destination: ['SYD'],
      area: 'PA'
    },
    {
      air: 'ac',
      origin: ['YVR'],
      destination: ['TYO'],
      area: 'PA'
    },
    {
      air: 'ac',
      origin: ['YWG', 'YTO'],
      destination: ['LON'],
      area: 'AT'
    },
    {
      air: 'ac',
      origin: ['YWG', 'YTO'],
      destination: ['PAR'],
      area: 'AT'
    },
    {
      air: 'ac',
      origin: ['YWG', 'YTO'],
      destination: ['FRA'],
      area: 'AT'
    },
    {
      air: 'ac',
      origin: ['YWG', 'YTO'],
      destination: ['FCO'],
      area: 'AT'
    },
    {
      air: 'ac',
      origin: ['YWG', 'YTO'],
      destination: ['MUC'],
      area: 'AT'
    },
    {
      air: 'ac',
      origin: ['YTO'],
      destination: ['BGI'],
      area: 'WH'
    },
    {
      air: 'ac',
      origin: ['YTO'],
      destination: ['CUN'],
      area: 'WH'
    },
    {
      air: 'ac',
      origin: ['YTO'],
      destination: ['POS'],
      area: 'WH'
    },
    {
      air: 'ac',
      origin: ['YTO'],
      destination: ['SKB'],
      area: 'WH'
    },
    {
      air: 'ac',
      origin: ['YTO'],
      destination: ['SVD'],
      area: 'WH'
    },
    {
      air: 'ac',
      origin: ['YTO'],
      destination: ['PTY'],
      area: 'WH'
    }
  ];

  const filteredMapping = sdMapping.filter();
};

const searchFlight = async (body) => {
  const ndcRequestData = mapNdcRequestData(body);
  const ndcBody = provideAirShoppingRequestTemplate(ndcRequestData);

  const response = await axios.post(
    'https://ndc-rct.airfranceklm.com/passenger/distribmgmt/001448v01/EXT',
    ndcBody,
    {
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        'Accept-Encoding': 'gzip,deflate',
        SOAPAction: '"http://www.af-klm.com/services/passenger/ProvideAirShopping/provideAirShopping"',
        'api_key': airFranceConfig.apiKey,
      },
    }
  );

  const { errors } = await transform(response.data, ErrorsTransformTemplate);
  
  if (errors.length) {
    throw new GliderError(
      errors.map(e => e.message).join('; '),
      502
    );
  };

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
      'AF',
      'AF',
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

module.exports = {
  searchFlight,
};
