const { transform } = require('camaro');
const { airFranceConfig, airCanadaConfig } = require('../../../config');
const GliderError = require('../../error');

const {
  mapNdcRequestData_AF,
  mapNdcRequestData_AC
} = require('../../transformInputData/createOrder');
const {
  orderCreateRequestTemplate_AF,
  orderCreateRequestTemplate_AC
} = require('../../soapTemplates/createOrder');
const {
  provideOrderCreateTransformTemplate_AF,
  provideOrderCreateTransformTemplate_AC,
  ErrorsTransformTemplate_AF,
  ErrorsTransformTemplate_AC,
  FaultsTransformTemplate_AC
} = require('../../camaroTemplates/provideOrderCreate');

const {
  mergeHourAndDate,
  reduceToObjectByKey,
  useDictionary,
  reduceContactInformation,
  splitPropertyBySpace
} = require('../../parsers');

const { callProvider } = require('../utils/flightUtils');

module.exports = async (offer, requestBody, guaranteeClaim) => {
  let ndcRequestData;
  let providerUrl;
  let apiKey;
  let SOAPAction;
  let ndcBody;
  let responseTransformTemplate;
  let errorsTransformTemplate;
  let faultsTransformTemplate;

  switch (offer.provider) {
    case 'AF':
      ndcRequestData = mapNdcRequestData_AF(airFranceConfig, requestBody);
      providerUrl = 'https://ndc-rct.airfranceklm.com/passenger/distribmgmt/001451v01/EXT';
      apiKey = airFranceConfig.apiKey;
      SOAPAction = '"http://www.af-klm.com/services/passenger/ProvideOrderCreate/provideOrderCreate"';
      ndcBody = orderCreateRequestTemplate_AF(ndcRequestData);
      responseTransformTemplate = provideOrderCreateTransformTemplate_AF;
      errorsTransformTemplate = ErrorsTransformTemplate_AF;
      faultsTransformTemplate = null;
      break;
    case 'AC':
      ndcRequestData = mapNdcRequestData_AC(airCanadaConfig, offer, requestBody, guaranteeClaim);
      providerUrl = 'https://pci.ndchub.mconnect.aero/messaging/v2/ndc-exchange/OrderCreate';
      apiKey = airCanadaConfig.apiKey;
      ndcBody = orderCreateRequestTemplate_AC(ndcRequestData);
      responseTransformTemplate = provideOrderCreateTransformTemplate_AC;
      errorsTransformTemplate = ErrorsTransformTemplate_AC;
      faultsTransformTemplate = FaultsTransformTemplate_AC;
      break;
    default:
      return Promise.reject('Unsupported flight operator');
  }

  const { response, error } = await callProvider(
    offer.provider,
    providerUrl,
    apiKey,
    ndcBody,
    SOAPAction
  );

  if (error && !error.isAxiosError) {
    
    throw new GliderError(
      response.error.message,
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
  }

  // Otherwise parse as a result
  const createResults = await transform(
    response.data,
    responseTransformTemplate
  );

  createResults.order.itinerary.segments = mergeHourAndDate(
    createResults.order.itinerary.segments,
    'splittedDepartureDate',
    'splittedDepartureTime',
    'departureTime'
  );
  createResults.order.itinerary.segments = mergeHourAndDate(
    createResults.order.itinerary.segments,
    'splittedArrivalDate',
    'splittedArrivalTime',
    'arrivalTime'
  );
  createResults.order.itinerary.segments = reduceToObjectByKey(
    createResults.order.itinerary.segments
  );
  createResults.order.price.commission =
    createResults.order.price.commission.reduce(
      (total, { value }) => total + parseFloat(value),
      0
    ).toString();
  createResults.order.price.taxes =
    createResults.order.price.taxes.reduce(
      (total, { value }) => total + parseFloat(value),
      0
    ).toString();
  createResults.order.contactList = reduceToObjectByKey(
    createResults.order.contactList
  );
  createResults.order.passengers = useDictionary(
    createResults.order.passengers,
    createResults.order.contactList,
    'contactInformation'
  );
  createResults.order.passengers = splitPropertyBySpace(
    createResults.order.passengers,
    'firstnames'
  );
  createResults.order.passengers = splitPropertyBySpace(
    createResults.order.passengers,
    'lastnames'
  );
  createResults.order.passengers = reduceContactInformation(
    createResults.order.passengers
  );
  createResults.order.passengers = reduceToObjectByKey(
    createResults.order.passengers
  );

  delete createResults.order.contactList;
  return createResults;
};
