const { Client } = require('@elastic/elasticsearch');
const config = require('../../config');
const packageJson = require('../../package.json');
const { indexException, indexEvent } = require('./handlers');

const client = new Client({
  node: config.elasticUrl,
  name: packageJson.name,
  maxRetries: 5
});

module.exports = {
  es: client,
  indexException: (...args) => indexException(client, args),
  indexEvent: (...args) => indexEvent(client, args)
};
