const axios = require('axios');
const GliderError = require('../error');
const qs = require('querystring');
const { logRQRS } = require('../log/logRQ');
const HTTP_TIMEOUT_SECONDS = 30;    //TODO - move to config
const TTL_BUFFER_SECONDS = 30;

/**
 * Class to hold API access token (bearer) and it's expiry time, together with logic to retrieve new token if needed
 */
class ApiToken {

  constructor () {
    this.token = undefined;
    this.expiryTime = undefined;
  }

  isExpired () {
    if (!this.expiryTime) {
      return true;
    }

    if (!this.token) {
      return true;
    }

    if ((Date.now() + (TTL_BUFFER_SECONDS * 1000)) > this.expiryTime) {
      return true;
    }

    return false;
  }

  getBearerToken () {
    return this.token;
  }

  processResponse (response) {
    const { expires_in: expiryInSeconds, access_token } = response;
    this.token = access_token;
    this.expiryTime = Date.now() + (expiryInSeconds * 1000);
  }

}

/**
 * Simple wrapper for axios to make post/get calls and receive responses
 * It is expected that by default it would be JSON content type but it's also possible to send URLEncoded content.
 * URLEncoded content is needed in case of OAuth requests (initial request to Amadeus API to receive API token)
 */
class SampleHttpClient {
  constructor () {

  }

  /**
   * Creates headers needed to request JSON content type
   * @param token - it it's provided, 'Authentication' header will be added with 'Bearer + token' value
   * @returns {{'Cache-Control': string, Connection: string, 'Accept-Encoding': string, 'Content-Type': string}}
   */
  static createHeadersJSONContent (token = undefined) {
    let headers = {
      'Content-Type': 'application/json',
      'Accept-Encoding': 'gzip,deflate',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }


  /**
   * Creates headers needed to request URLEncoded content type
   * @param token - it it's provided, 'Authentication' header will be added with 'Bearer + token' value
   * @returns {{'Cache-Control': string, Connection: string, 'Accept-Encoding': string, 'Content-Type': string}}
   */
  static createHeadersURLEncodedContent (token = undefined) {
    let headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept-Encoding': 'gzip,deflate',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }

  /**
   * Make an HTTP GET call to an URL passed as a parameter.
   * @param url URL to make a call to
   * @param token if provider, it will be added to 'Authentication' header (as bearer token)
   * @returns {Promise<*>}
   */
  static async getRequest (url, token = undefined) {
    let response;
    response = await axios.get(url, {
      headers: SampleHttpClient.createHeadersJSONContent(token),
      timeout: HTTP_TIMEOUT_SECONDS * 1000,
    });
    logRQRS(response, 'RAW_RESPNSE');
    return response;
  }


  /**
   * Make an HTTP POST call to an URL passed as a parameter.
   * @param url URL to make a call to
   * @param body request body to be sent
   * @param token if provider, it will be added to 'Authentication' header (as bearer token)
   * @param urlEncodedContentType if true - URLEncoded content type will be requested and body will be encoded as form param-value pairs
   * @returns {Promise<*>}
   */
  static async postRequest (url, body, token = undefined, urlEncodedContentType = false) {
    let response;
    if (urlEncodedContentType) {
      body = qs.stringify(body);  //if it's URLEncoded content type, body needs to be converted
    }
    response = await axios.post(url, body, {
      headers: (urlEncodedContentType ? SampleHttpClient.createHeadersURLEncodedContent(token) : SampleHttpClient.createHeadersJSONContent(token)),
      timeout: HTTP_TIMEOUT_SECONDS * 1000,
    });
    logRQRS(response, 'RAW_RESPNSE');
    return response;
  }

}

/**
 * Amadeus API client wrapper.
 * It takes care of initial authentication and subsequent authentications in case API token expires.
 *
 */
class AmadeusClient {
  /**
   * Creates an new instance
   * @param url Base url to be used, for example in test it should be 'https://test.travel.api.amadeus.com'
   * @param client_id
   * @param client_secret
   */
  constructor (url, client_id, client_secret) {
    this.url = url;
    this.client_id = client_id;
    this.client_secret = client_secret;
    this.token = new ApiToken();
    console.log(`Creating AmadeusClient instance, URL:${url},client_id:${client_id}, client_secret:${client_secret}`);
  }

  /**
   * Make a GET call to a url provided as parameter
   * @param url Relative path that should be used.
   * @returns {Promise<*>}
   */
  async doGet (url, params) {
    if (this.token.isExpired()) {
      await this._authenticate();
    }
    let fullUrl = this._createUrl(url);
    if (params) {
      fullUrl = `${fullUrl}?${qs.stringify(params)}`;
    }
    console.log(`GET ${fullUrl}, token:${this.token.getBearerToken()}`);
    return SampleHttpClient.getRequest(fullUrl, this.token.getBearerToken());
  }

  /**
   * Make a POST call to a url provided as parameter
   * @param url Relative path that should be used.
   * @param body JSON body to be sent to Amadeus API
   * @returns {Promise<*>}
   */
  async doPost (url, body) {
    if (this.token.isExpired()) {
      await this._authenticate();
    }
    let fullUrl = this._createUrl(url);
    console.log(`POST ${fullUrl}, token:${this.token.getBearerToken()}`);
    return SampleHttpClient.postRequest(fullUrl, body, this.token.getBearerToken());
  }


  async _authenticate () {
    let url = this._createUrl('/v1/security/oauth2/token');
    const request = {
      client_id: this.client_id,
      client_secret: this.client_secret,
      grant_type: 'client_credentials',
    };
    try {
      console.log(`GET ${url}`);
      let response = await SampleHttpClient.postRequest(url, request, undefined, true);
      this.token.processResponse(response.data);
    } catch (err) {
      console.error('Failed to authenticate with the 3rd party provider', err);
      throw new GliderError('Failed to authenticate with the 3rd party provider', 500);
    }
  }

  _createUrl (suffix) {
    if (suffix.startsWith('/'))
      return `${this.url}${suffix}`;
    else
      return `${this.url}/${suffix}`;
  }
}

module.exports = { ApiToken, AmadeusClient };
