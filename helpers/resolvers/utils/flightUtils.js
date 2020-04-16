const caDestinations = require('./cadest.json');

// Fetching of the flight operators associated with the given origin and destination
const selectProvider = (origin, destination) => {
  origin = Array.isArray(origin) ? origin : [origin];
  destination = Array.isArray(destination) ? destination : [destination];

  const sdMapping = [
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
    }, []);
};
module.exports.selectProvider = selectProvider;
