const axios = require('axios');
const caDestinations = require('./cadest.json');

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
