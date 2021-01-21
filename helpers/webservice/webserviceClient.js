const axios = require('axios');
const { logRQRS } = require('../log/logRQ');
const GliderError = require('../error');

/**
 * Create a definition/configuration for a specific type of webservice call.
 * @param webserviceName  unique webservice request identifier
 * @param url webservice endpoint URL
 * @param soapAction Should SOAPAction header be specified - provide it's value as parameters
 * @param customHeaders Additional headers to be used
 * @param timeout Max time we should wait for a response from webservice (in millisec). If it's -1, default value will be used
 * @returns {{webserviceName, soapAction, url, customHeaders: {}, timeout: number}}
 */
const createWebserviceDefinition = (webserviceName, url, soapAction, customHeaders = {}, timeout = -1) => {
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
      if(error.response){
        //request was made and server responded with a status code
        return error.response;
      }else if(error.request){
        //request was made but there was no response
        throw new GliderError(`No response from provider, ${error.message}`, 408);
      }else{
        //Something happened in setting up the request that triggered an Error
        throw new GliderError(`No response from provider, ${error.message}`, 500);
      }

    }
    return response;
  }
}



module.exports = {
  createWebserviceDefinition: createWebserviceDefinition,
  WebserviceClient
};
