const axios = require('axios');
const { logRQRS } = require('../log/logRQ');
const GliderError = require('../error');

const webserviceDefinition = (webserviceName, url, soapAction, customHeaders = {}, timeout = -1) => {
  return {
    webserviceName: webserviceName,
    url: url,
    soapAction: soapAction,
    customHeaders: customHeaders,
    timeout: timeout,
  };
};

class WebserviceClient {
  constructor (webservices) {
    this._webservices = webservices;
  }

  _getWebserviceConfiguration (webserviceName) {
    const wbsConfig = this._webservices.find(config => config.webserviceName === webserviceName);
    if (!wbsConfig)
      throw new GliderError(`Missing configuration for webservice ${webserviceName}`, 500);
    return wbsConfig;
  };

  _createHeaders (wbsConfig) {
    const { soapAction: SOAPAction, customHeaders } = wbsConfig;
    let commonHeaders = {
      'Content-Type': 'application/xml;charset=UTF-8',
      'Accept-Encoding': 'gzip,deflate',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      ...(SOAPAction ? { SOAPAction } : {}),
    };
    let headers = Object.assign({}, commonHeaders, customHeaders);
    return headers;
  }

  async wbsRequest (webserviceName, ndcBody) {
    const wbsConfig = this._getWebserviceConfiguration(webserviceName);
    const { url } = wbsConfig;

    let response;
    let urlParts = url.split('/');
    let action = urlParts[urlParts.length - 1];
    try {
      logRQRS(ndcBody, `${action} - request`);
      // Request connection timeouts can be handled via CancelToken only
      const timeout = 60 * 1000; // 60 sec
      const source = axios.CancelToken.source();
      const connectionTimeout = setTimeout(() => source.cancel(`Cannot connect to the source: ${url}`), timeout);// connection timeout
      response = await axios.post(url, ndcBody,
        {
          headers: this._createHeaders(wbsConfig),
          cancelToken: source.token, // Request timeout
          timeout, // Response timeout
        });
      clearTimeout(connectionTimeout);
      logRQRS(response, `${action} - response`);
    } catch (error) {
      logRQRS(error, `${action} - response error`);
      throw new GliderError(error.message, 500);
    }
    return response;
  }
}


module.exports = {
  webserviceDefinition,
  WebserviceClient,
};
