const FlightProviderNDCCommon = require('../ndc/flightProviderNDCCommon');
const { ndcRequest } = require('../ndc/ndcUtils');
const { transform } = require('camaro');
const { airFranceConfig } = require('../../../../config');
const GliderError = require('../../../error');

//shopping templates
const { mapNdcRequestData_AF } = require('./transformInputData/searchOffers');
const { provideShoppingRequestTemplate_AF } = require('./soapTemplates/searchOffers');
const { provideAirShoppingTransformTemplate_AF, ErrorsTransformTemplate_AF } = require('./camaroTemplates/shoppingTemplate');

//order create templates
const { mapNdcRequestData_AF: mapNdcOrderCreateRequestData_AF } = require('../ac/transformInputData/createOrder');
const { orderCreateRequestTemplate_AF } = require('./soapTemplates/createOrder');
const {
  provideOrderCreateTransformTemplate_AF,
  ErrorsTransformTemplate_AF:OrderCreateErrorsTransformTemplate_AF,
} = require('./camaroTemplates/provideOrderCreate');

const { reMapPassengersInRequestBody } = require('../../../resolvers/utils/flightUtils');

module.exports = class FlightProviderAF extends FlightProviderNDCCommon {
  constructor () {
    super();
  }

  async flightSearch (itinerary, passengers) {
    console.log('AF searching.....');
    let ndcRequestData;
    let providerUrl;
    let apiKey;
    let SOAPAction;
    let ndcBody;
    let body = { itinerary: itinerary, passengers: passengers };
    ndcRequestData = mapNdcRequestData_AF(airFranceConfig, body);
    providerUrl = 'https://ndc-rct.airfranceklm.com/passenger/distribmgmt/001448v01/EXT';
    apiKey = airFranceConfig.apiKey;
    SOAPAction = '"http://www.af-klm.com/services/passenger/ProvideAirShopping/provideAirShopping"';
    ndcBody = provideShoppingRequestTemplate_AF(ndcRequestData);
    let { response } = await ndcRequest(providerUrl, apiKey, ndcBody, SOAPAction);
    let errorsResult = await transform(response.data, ErrorsTransformTemplate_AF);
    let searchResults = await transform(response.data, provideAirShoppingTransformTemplate_AF);
    return { provider: this.getProviderID(), response: searchResults, errors: errorsResult ? errorsResult.errors : [] };
  }

  // eslint-disable-next-line no-unused-vars
  async priceOffers (body, offers){
    throw new Error('Not implemented');
  }

  // eslint-disable-next-line no-unused-vars
  async orderCreate (offer, requestBody, guaranteeClaim){
    let ndcRequestData;
    let providerUrl;
    let apiKey;
    let SOAPAction;
    let ndcBody;
    let responseTransformTemplate;
    let errorsTransformTemplate;
    let faultsTransformTemplate;


    requestBody = reMapPassengersInRequestBody(offer, requestBody);
    ndcRequestData = mapNdcOrderCreateRequestData_AF(airFranceConfig, requestBody);
    providerUrl = 'https://ndc-rct.airfranceklm.com/passenger/distribmgmt/001451v01/EXT';
    apiKey = airFranceConfig.apiKey;
    SOAPAction = '"http://www.af-klm.com/services/passenger/ProvideOrderCreate/provideOrderCreate"';
    ndcBody = orderCreateRequestTemplate_AF(ndcRequestData);
    responseTransformTemplate = provideOrderCreateTransformTemplate_AF;
    errorsTransformTemplate = OrderCreateErrorsTransformTemplate_AF;
    faultsTransformTemplate = null;
    const { response, error } = await ndcRequest(providerUrl, apiKey, ndcBody, SOAPAction);
    if (error && !error.isAxiosError) {

      throw new GliderError(
        error.message,
        502,
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
      ...errorsResult.errors,
    ];

    // If an error is found, stop here
    if (combinedErrors.length) {
      throw new GliderError(
        combinedErrors.map(e => e.message).join('; '),
        502,
      );
    } else if (error) {
      throw new GliderError(
        error.message,
        502,
      );
    }
    // Otherwise parse as a result
    const createResults = await transform(response.data, responseTransformTemplate);
    return createResults;


  }



  getProviderID () {
    return 'AC';
  }
};

