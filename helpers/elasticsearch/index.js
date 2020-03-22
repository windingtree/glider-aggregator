const { Client } = require('@elastic/elasticsearch');
const config = require('../../config');
const packageJson = require('../../package.json');
const { indexException, indexEvent } = require('./handlers');

const client = new Client({
  node: config.elasticUrl,
  name: packageJson.name
});

module.exports = {
  es: client,
  indexException: (request, error) => indexException(client, request, error),
  indexEvent: (request, error) => indexEvent(client, request, error)
};
