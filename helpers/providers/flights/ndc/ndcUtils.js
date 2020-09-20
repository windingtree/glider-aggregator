const axios = require('axios');
const { logRQRS } = require('../../../amadeus/logRQ');
const { transform } = require('camaro');

const transformNDCFault = (response, template) => {
  return transform(response, template);
};


const transformNdcResponse = (response, templates) => {
  return transform(response.data, templates.response);
};

const ndcRequest = async (apiEndpoint, apiKey, ndcBody, SOAPAction) => {
  let response;
  let urlParts = apiEndpoint.split('/');
  let action=urlParts[urlParts.length-1];
  try {
    logRQRS(ndcBody, `${action} - request`);
    // Request connection timeouts can be handled via CancelToken only
    const timeout = 60 * 1000; // 60 sec
    const source = axios.CancelToken.source();
    const connectionTimeout = setTimeout(() => source.cancel(
      `Cannot connect to the source: ${apiEndpoint}`,
    ), timeout);// connection timeout
    response = await axios.post(
      apiEndpoint,
      ndcBody,
      {
        headers: {
          'Content-Type': 'application/xml;charset=UTF-8',
          'Accept-Encoding': 'gzip,deflate',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'api_key': apiKey,
          'X-apiKey': apiKey,
          ...(SOAPAction ? { SOAPAction } : {}),
        },
        cancelToken: source.token, // Request timeout
        timeout, // Response timeout
      },
    );
    clearTimeout(connectionTimeout);
    logRQRS(response.data, `${action} - response`);
  } catch (error) {
    logRQRS(error, `${action} - response error`);
    return {
      response: error.response,
      error,
    };
  }
  return {
    response,
  };
};


module.exports = {
  transformNDCFault: transformNDCFault,
  transformNdcResponse: transformNdcResponse,
  ndcRequest: ndcRequest,
};
