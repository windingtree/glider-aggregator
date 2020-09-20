const { transform } = require('camaro');
const GliderError = require('../../../error');


const assertResponseErrors = async (response, errorTemplate, faultTemplate) => {
  let faultsResult = faultTemplate ? await transform(response, faultTemplate) : undefined;
  let errorsResult = errorTemplate ? await transform(response, errorTemplate) : undefined;
  const combinedErrors = [
    ...(faultsResult ? faultsResult.errors : []),
    ...(errorsResult ? errorsResult.errors : []),
  ];
  if (combinedErrors.length) {
    throw new GliderError(combinedErrors.map(e => e.message).join('; '), 502);
  }
};

module.exports = { assertResponseErrors };
