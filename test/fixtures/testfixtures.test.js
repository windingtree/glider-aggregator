/**
 * This module contains some example fixtures for elements that create offers search request payload.
 * They are meant to be used in tests.
 */

//locations
const locationFixtureDFW = { locationType: 'airport', iataCode: 'DFW' };
const locationFixtureJFK = { locationType: 'airport', iataCode: 'JFK' };
const locationFixtureLGA = { locationType: 'airport', iataCode: 'LGA' };
const locationFixtureLHR = { locationType: 'airport', iataCode: 'LHR' };
const locationRectangleFixture = { south: '55.13', west: '10.59', north: '69.06', east: '24.18' };
const locationCircleFixture = { lat: '55.13', long: '10.59', radius: '10' };
const locationPolygonFixture = [[24.8963928, 60.1749466], [24.9700356, 60.1763126], [24.9720097, 60.1475721]];

const LocationFixtures = {
  locationFixtureDFW: locationFixtureDFW,
  locationFixtureJFK: locationFixtureJFK,
  locationFixtureLGA: locationFixtureLGA,
  locationFixtureLHR: locationFixtureLHR,
  locationRectangleFixture: locationRectangleFixture,
  locationCircleFixture: locationCircleFixture,
  locationPolygonFixture: locationPolygonFixture,
};


//dates
const dateFixture20201001 = '2020-10-01T13:10:04.687Z';
const dateFixture20201015 = '2020-10-15T15:15:04.687Z';
const dateFixture20201020 = '2021-10-20T10:20:04.687Z';

const DateFixtures = {
  dateFixture20201001: dateFixture20201001,
  dateFixture20201015: dateFixture20201015,
  dateFixture20201020: dateFixture20201020,
};

//segments
const segmentFixtureJFKDFW_20201001 = {
  origin: locationFixtureJFK,
  destination: locationFixtureDFW,
  departureTime: dateFixture20201001,
};
const segmentFixtureDFWJFK_20201015 = {
  origin: locationFixtureDFW,
  destination: locationFixtureJFK,
  departureTime: dateFixture20201015,
};
const segmentFixtureLGALHR_20201020 = {
  origin: locationFixtureLGA,
  destination: locationFixtureLHR,
  departureTime: dateFixture20201020,
};

const SegmentFixtures = {
  segmentFixtureJFKDFW_20201001: segmentFixtureJFKDFW_20201001,
  segmentFixtureDFWJFK_20201015: segmentFixtureDFWJFK_20201015,
  segmentFixtureLGALHR_20201020: segmentFixtureLGALHR_20201020,
};

//passengers
const passengerCriteriaFixture1ADT = { type: 'ADT', count: 1 };
const passengerCriteriaFixture2ADT = { type: 'ADT', count: 2 };
const passengerCriteriaFixture1CHD = { type: 'CHD', count: 1 };
const passengerCriteriaFixture1INF = { type: 'INF', count: 1 };

const PassengerFixtures = {
  passengerCriteriaFixture1ADT: passengerCriteriaFixture1ADT,
  passengerCriteriaFixture2ADT: passengerCriteriaFixture2ADT,
  passengerCriteriaFixture1CHD: passengerCriteriaFixture1CHD,
  passengerCriteriaFixture1INF: passengerCriteriaFixture1INF,
};

//itineraries
const itineraryFixtureJFKDFW_Return = { segments: [segmentFixtureJFKDFW_20201001, segmentFixtureDFWJFK_20201015] };
const itineraryFixtureJFKDFW_OneWay = { segments: [segmentFixtureJFKDFW_20201001] };

const ItineraryFixtures = {
  itineraryFixtureJFKDFW_Return: itineraryFixtureJFKDFW_Return,
  itineraryFixtureJFKDFW_OneWay: itineraryFixtureJFKDFW_OneWay,
};

//accommodations
const accommodationRectangleFixture = {
  location: { rectangle: locationRectangleFixture },
  arrival: dateFixture20201015,
  departure: dateFixture20201020,
};
const accommodationCircleFixture = {
  location: { circle: locationCircleFixture },
  arrival: dateFixture20201015,
  departure: dateFixture20201020,
};
const accommodationPolygonFixture = {
  location: { polygon: locationPolygonFixture },
  arrival: dateFixture20201015,
  departure: dateFixture20201020,
};

const AccommodationFixtures = {
  accommodationRectangleFixture: accommodationRectangleFixture,
  accommodationCircleFixture: accommodationCircleFixture,
  accommodationPolygonFixture: accommodationPolygonFixture,
};


const flightSearchFixtureJFKDFW_OneWay_1ADT = {
  itinerary: itineraryFixtureJFKDFW_OneWay,
  passengers: [passengerCriteriaFixture1ADT],
};
const flightSearchFixtureJFKDFW_Return_2ADT_1INF = {
  itinerary: itineraryFixtureJFKDFW_Return,
  passengers: [passengerCriteriaFixture2ADT, passengerCriteriaFixture1INF],
};

const hotelSearchFixtureRectangle_1ADT = {
  accommodation: accommodationRectangleFixture,
  passengers: [passengerCriteriaFixture1ADT],
};

const hotelSearchFixtureCircle_2ADT = {
  accommodation: accommodationCircleFixture,
  passengers: [passengerCriteriaFixture2ADT],
};

const hotelSearchFixturePolygon_2ADT = {
  accommodation: accommodationPolygonFixture,
  passengers: [passengerCriteriaFixture2ADT],
};

const SearchCriteriaFixtures = {
  flightSearchFixtureJFKDFW_OneWay_1ADT,
  flightSearchFixtureJFKDFW_Return_2ADT_1INF,
  hotelSearchFixtureRectangle_1ADT,
  hotelSearchFixtureCircle_2ADT,
  hotelSearchFixturePolygon_2ADT
};


module.exports = {
  LocationFixtures,
  DateFixtures,
  SegmentFixtures,
  PassengerFixtures,
  ItineraryFixtures,
  AccommodationFixtures,
  SearchCriteriaFixtures,
};
