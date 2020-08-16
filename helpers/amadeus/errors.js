const GliderError = require('../error');

const transformAmadeusFault = (response) => {
  let errors = [];
  if (response && response.errors) {
    errors = response.errors.map(error => {
      return { message: error.title, code: error.code, type: error.status };
    });
  }
  return {
    errors: errors
  };
};

// Look for all types of response errors
const assertAmadeusFault = (response, error) => {
  if (error) {
    throw new GliderError(error.message, 502);
  }
};




module.exports.transformAmadeusFault=transformAmadeusFault;
module.exports.assertAmadeusFault=assertAmadeusFault;
