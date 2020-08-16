const Amadeus = require('amadeus');
const { amadeusGdsConfig } = require('../../config');

let amadeusClient;

const getAmadeusClient =  () => {

  if (amadeusClient) {
    return amadeusClient;
  }

  amadeusClient = new Amadeus({
    clientId: amadeusGdsConfig.clientId,
    clientSecret: amadeusGdsConfig.clientSecret
  });

  return amadeusClient;
};

module.exports = {
  getAmadeusClient
};
