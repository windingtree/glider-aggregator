
const erevmaxHotels = [
  {
    provider: 'EREVMAX',
    ref: '07119',
    latitude: 59.33309777,
    longitude: 18.05437602,
    currency: 'SEK',
  },
  {
    provider: 'EREVMAX',
    ref: '32788',
    latitude: 63.17994135,
    longitude: 14.63636847,
    currency: 'SEK',
  },
  {
    provider: 'EREVMAX',
    ref: '568362',
    latitude: 59.2744489,
    longitude: 15.2120792,
    currency: 'SEK',
  },
  {
    provider: 'EREVMAX',
    ref: '02034',
    latitude: 57.70109464,
    longitude: 11.91391245,
    currency: 'SEK',
  },
  {
    provider: 'EREVMAX',
    ref: '568259',
    latitude: 60.1598169,
    longitude: 24.9219572,
    currency: 'EUR',
  },
  {
    provider: 'EREVMAX',
    ref: '04393',
    latitude: 59.91207189,
    longitude: 10.75123385,
    currency: 'NOK',
  },
  {
    provider: 'EREVMAX',
    ref: '08801',
    latitude: 55.59966077,
    longitude: 13.00733216,
    currency: 'DKK',
  },
  {
    provider: 'EREVMAX',
    ref: '209093',
    latitude: 58.9535861,
    longitude: 5.6884671,
    currency: 'NOK',
  },
  {
    provider: 'EREVMAX',
    ref: '537108',
    latitude: 69.647276,
    longitude: 18.952136,
    currency: 'NOK',
  },
];

const getHotelsInRectangle = (rectangle) => {
  return erevmaxHotels
    .map(({ ref }) => ref);
};

module.exports = {
  getHotelsInRectangle,
  erevmaxHotels,
};
