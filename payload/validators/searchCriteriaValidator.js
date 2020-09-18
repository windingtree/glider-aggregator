const Ajv = require('ajv');
const schema = require('../schemas/wt-aggregator-schema.json');
const GliderError = require('../../helpers/error');

/**
 * Validates if a request made to /offers/search is valid and also adds missing properties which have their default values specified in swagger definition.
 * @param payload
 * @return true if payload is valid, false otherwise
 */
const validateSearchCriteria = (payload) => {
  let ajv = new Ajv({ useDefaults: true });
  ajv.addSchema(schema, 'swagger.json');
  let result = ajv.validate({ $ref: 'swagger.json#/components/schemas/SearchCriteria' }, payload);

  if (!result) {
    // console.log('invalid, original payload:', JSON.stringify(payload));
    let error = ajv.errors[0];
    let message = `Validation error. Property:[${error.dataPath}], problem:[${error.message}]`;
    throw new GliderError(message, 400);
  }
  return payload;
};

module.exports = {
  validateSearchCriteria: validateSearchCriteria,
};
