const { transform } = require('camaro');
const GliderError = require('../../error');

// Look for all types of response errors
module.exports = async (
  error,
  response,
  faultsTransformTemplate,
  errorsTransformTemplate
) => {

  if (error && !error.isAxiosError) {
    
    throw new GliderError(
      error.message,
      502
    );
  }

  let faultsResult;

  if (faultsTransformTemplate) {
    faultsResult = await transform(response.data, faultsTransformTemplate);
  }

  // Attempt to parse as a an error
  const errorsResult = await transform(response.data, errorsTransformTemplate);

  // Because of two types of errors can be returned: NDCMSG_Fault and Errors
  const combinedErrors = [
    ...(faultsResult ? faultsResult.errors : []),
    ...errorsResult.errors
  ];

  // If an error is found, stop here
  if (combinedErrors.length) {
    throw new GliderError(
      combinedErrors.map(e => e.message).join('; '),
      502
    );
  } else if (error) {
    throw new GliderError(
      error.message,
      502
    );
  }
};
