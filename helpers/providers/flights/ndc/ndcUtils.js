const axios = require('axios');
const { transform } = require('camaro');

const transformNDCFault = (response, template) => {
  return transform(response, template);
};


const transformNdcResponse = (response, templates) => {
  return transform(response.data, templates.response);
};

const ndcRequest = async (apiEndpoint, apiKey, ndcBody, SOAPAction) => {
  let response;
  console.log('will make a call to NDC endpoint:', apiEndpoint);
  try {
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
  } catch (error) {
    console.log('Got error from NDC endpoint', error);
    return {
      response: error.response,
      error,
    };
  }
  console.log('No errors from NDC endpoint');
  return {
    response,
  };
};


module.exports = {
  transformNDCFault: transformNDCFault,
  transformNdcResponse: transformNdcResponse,
  ndcRequest: ndcRequest,
};
