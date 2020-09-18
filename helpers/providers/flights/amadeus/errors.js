const GliderError = require('../../../error');

const transformAmadeusFault = (result) => {
  let errors = [];
  if (result && result.errors) {
    errors = result.errors.map(error => {
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
    let message = error.map(e=>e.title).join(';');
    throw new GliderError(message, 502);
  }
};




module.exports.transformAmadeusFault=transformAmadeusFault;
module.exports.assertAmadeusFault=assertAmadeusFault;
