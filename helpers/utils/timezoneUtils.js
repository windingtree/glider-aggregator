const { zonedTimeToUtc } = require('date-fns-tz');
const { airports } = require('./timeZoneByAirportCode');


const convertLocalAirportTimeToUtc = (localDateTime, iataCode) => {
  return zonedTimeToUtc(localDateTime, airports[iataCode]);
};

const convertDateToAirportTime = (date, time, iataCode) => zonedTimeToUtc(
  `${date} ${time}:00.000`,
  airports[iataCode]
);

module.exports = { convertLocalAirportTimeToUtc, convertDateToAirportTime };
