const redis = require('redis');
const config = require('../../config');

// Creation of the Redis client
let redisClient = redis.createClient(config.redisUrl);

// Asynchronous version of get
redisClient.asyncGet = key => new Promise((resolve, reject) => {
  redisClient.get(key, (error, result) => {

    if (error) {
      return reject(error);
    }

    resolve(result);
  });
});

// Errors handler
redisClient.on('error', (error) => {
  console.error(error);

  if (error.code === 'ECONNREFUSED') {
    // Fallback to Map
    redisClient = new Map();
    redisClient.asyncGet = key => Promise.resolve(redisClient.get(key));
    console.log('Fallback to Map instead of Redis');
  }
});

// Close connetion to the Redis on exit
process.on('exit', function () {
  redisClient.quit();
});

module.exports = {
  redis,
  redisClient
};
