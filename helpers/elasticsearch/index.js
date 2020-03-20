const ElasticSearch = require('elasticsearch');
const config = require('../../config');

const client = new ElasticSearch.Client({
  host: config.elasticUrl,
  log: 'error'
});

module.exports = {
  client
};
