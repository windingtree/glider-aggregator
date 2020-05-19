const axios = require('axios');
const caDestinations = require('./cadest.json');
const GliderError = require('../../error');
const {
  offerManager,
  FlightOffer
} = require('../../models/offer');

// Send a request to the provider
module.exports.callProvider = async (
  provider,
  apiEndpoint,
  apiKey,
  ndcBody,
  SOAPAction,
  templates
) => {
  let response;

  try {
    // Request connection timeouts can be handled via CancelToken only
    const timeout = 60 * 1000; // 60 sec
    const source = axios.CancelToken.source();
    const connectionTimeout = setTimeout(() => source.cancel(
        `Cannot connect to the source: ${apiEndpoint}`
    ), timeout);// connection timeout

    response = await axios.post(
      apiEndpoint,
      ndcBody,
      {
        headers: {
          'Content-Type': 'application/xml;charset=UTF-8',
          'Accept-Encoding': 'gzip,deflate',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
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
      templates,
      response: error.response,
      error
    };
  }

  return {
    provider,
    templates,
    response
  }
};

// Fetching of the flight operators associated with the given origin and destination
module.exports.selectProvider = (origin, destination) => {
  origin = Array.isArray(origin) ? origin : [origin];
  destination = Array.isArray(destination) ? destination : [destination];

  const sdMapping = [
    {
      provider: 'AF',
      destinations: []
    },
    {
      provider: 'AC',
      destinations: caDestinations
    }
  ];

  // const sdMapping = [
  //   {
  //     provider: 'AC',
  //     origin: ['YQQ'],
  //     destination: ['YXU'],
  //     area: 'CA'
  //   },
  //   {
  //     provider: 'AC',
  //     origin: ['YTO'],
  //     destination: ['YVR'],
  //     area: 'CA'
  //   },
  //   {
  //     provider: 'AC',
  //     origin: ['YMM'],
  //     destination: ['YXU', 'YYT'],
  //     area: 'CA'
  //   },
  //   {
  //     provider: 'AC',
  //     origin: ['YHZ'],
  //     destination: ['YQR', 'YYJ'],
  //     area: 'CA'
  //   },
  //   {
  //     provider: 'AC',
  //     origin: ['YEA'],
  //     destination: ['YXE', 'YYC', 'YZR'],
  //     area: 'CA'
  //   },
  //   {
  //     provider: 'AC',
  //     origin: ['YYC'],
  //     destination: ['YVR', 'YWG', 'YYT', 'YTO'],
  //     area: 'CA'
  //   },
  //   {
  //     provider: 'AC',
  //     origin: ['YMQ'],
  //     destination: ['YVR', 'YWG', 'YYT', 'YTO'],
  //     area: 'CA'
  //   },
  //   {
  //     provider: 'AC',
  //     origin: ['YOB'],
  //     destination: ['LAS'],
  //     area: 'US'
  //   },
  //   {
  //     provider: 'AC',
  //     origin: ['YWG'],
  //     destination: ['DEN', 'STL'],
  //     area: 'US'
  //   },
  //   {
  //     provider: 'AC',
  //     origin: ['YVR'],
  //     destination: ['CHI', 'LAS', 'LAX'],
  //     area: 'US'
  //   },
  //   {
  //     provider: 'AC',
  //     origin: ['YTO'],
  //     destination: ['CHI', 'DFW', 'FLL', 'LAX'],
  //     area: 'US'
  //   },
  //   {
  //     provider: 'AC',
  //     origin: ['YMQ'],
  //     destination: ['BOS', 'CHI', 'DEN', 'LAS', 'LAX', 'SFO'],
  //     area: 'US'
  //   },
  //   {
  //     provider: 'AC',
  //     origin: ['YVR'],
  //     destination: ['SIN'],
  //     area: 'PA'
  //   },
  //   {
  //     provider: 'AC',
  //     origin: ['YVR'],
  //     destination: ['BKK'],
  //     area: 'PA'
  //   },
  //   {
  //     provider: 'AC',
  //     origin: ['YVR'],
  //     destination: ['SYD'],
  //     area: 'PA'
  //   },
  //   {
  //     provider: 'AC',
  //     origin: ['YVR'],
  //     destination: ['TYO'],
  //     area: 'PA'
  //   },
  //   {
  //     provider: 'AC',
  //     origin: ['YWG', 'YTO'],
  //     destination: ['LON'],
  //     area: 'AT'
  //   },
  //   {
  //     provider: 'AC',
  //     origin: ['YWG', 'YTO'],
  //     destination: ['PAR'],
  //     area: 'AT'
  //   },
  //   {
  //     provider: 'AC',
  //     origin: ['YWG', 'YTO'],
  //     destination: ['FRA'],
  //     area: 'AT'
  //   },
  //   {
  //     provider: 'AC',
  //     origin: ['YWG', 'YTO'],
  //     destination: ['FCO'],
  //     area: 'AT'
  //   },
  //   {
  //     provider: 'AC',
  //     origin: ['YWG', 'YTO'],
  //     destination: ['MUC'],
  //     area: 'AT'
  //   },
  //   {
  //     provider: 'AC',
  //     origin: ['YTO'],
  //     destination: ['BGI'],
  //     area: 'WH'
  //   },
  //   {
  //     provider: 'AC',
  //     origin: ['YTO'],
  //     destination: ['CUN'],
  //     area: 'WH'
  //   },
  //   {
  //     provider: 'AC',
  //     origin: ['YTO'],
  //     destination: ['POS'],
  //     area: 'WH'
  //   },
  //   {
  //     provider: 'AC',
  //     origin: ['YTO'],
  //     destination: ['SKB'],
  //     area: 'WH'
  //   },
  //   {
  //     provider: 'AC',
  //     origin: ['YTO'],
  //     destination: ['SVD'],
  //     area: 'WH'
  //   },
  //   {
  //     provider: 'AC',
  //     origin: ['YTO'],
  //     destination: ['PTY'],
  //     area: 'WH'
  //   }
  // ];

  // return sdMapping
  //   .filter(m => (
  //     m.origin.includes(origin) && m.destination.includes(destination)
  //   ))
  //   .map(m => m.provider)
  //   .filter((p, i, s) => s.indexOf(p) === i);

  return sdMapping
    .reduce((a, v) => {

      if (
        (v.destinations.filter(d => origin.includes(d)).length > 0 ||
        v.destinations.filter(d => destination.includes(d)).length > 0) &&
        !a.includes(v.provider)
      ) {
        a.push(v.provider);
      }

      return a;
    }, ['AF']);// temporary until we do not have a specific set for AF
};

module.exports.reMapPassengersInRequestBody = (offer, body) => {
  if (offer.extraData && offer.extraData.mappedPassengers) {
    body.offerItems = Object.entries(body.offerItems)
      .map(item => {
        item[1].passengerReferences = item[1].passengerReferences
          .split(' ')
          .map(r => offer.extraData.mappedPassengers[r])
          .join(' ');
        return item;
      })
      .reduce((a, v) => ({
        ...a,
        [v[0]]: v[1]
      }), {});
      body.passengers = Object.entries(body.passengers)
      .map(p => {
        p[0] = offer.extraData.mappedPassengers[p[0]];
        return p;
      })
      .reduce((a, v) => ({
        ...a,
        [v[0]]: v[1]
      }), {});
  } else {
    throw new GliderError(
      'Mapped passengers Ids not found in the offer',
      500
    );
  }

  return body;
};

// Fetch Flight offers with type validation
module.exports.fetchFlightsOffersByIds = async offerIds => {
  // Retrieve the offers
  const offers = (await Promise.all(offerIds.map(
    offerId => offerManager.getOffer(offerId)
  )))
    // Should be FlightOffer of type and have same provider
    .filter((offer, i, array) => (
      offer instanceof FlightOffer &&
      offer.provider === array[0].provider
    ));

  if (offers.length === 0) {
    throw new GliderError(
      'Offer not found',
      400
    );
  }

  return offers;
};

// Removes passengers dublicates from offered priced options
// makes ONE passenger per OPTION
module.exports.dedupPassengersInOptions = options => options
.reduce(
  (a, v) => {
    const option = a.filter(o => o.code === v.code);
    if (option.length > 0) {
      option[0].passenger = [
        ...new Set([
          ...option[0].passenger.split(' '),
          ...v.passenger.split(' ')
        ])
      ].join(' ');
    } else {
      a.push(v);
    }
    return a;
  },
  []
)
.reduce(
  (a, v) => {
    v.passenger
      .split(' ')
      .forEach(passenger => {
        a.push({
          ...v,
          passenger
        });
      });
    return a;
  },
  []
);
