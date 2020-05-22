const { ready, transform } = require('camaro');
const { airFranceConfig, airCanadaConfig } = require('../../../config');
const GliderError = require('../../error');
const {
  mapNdcRequestData_AF,
  mapNdcRequestHeaderData_AC,
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
  splitPropertyBySpace,
  reduceToProperty
} = require('../../parsers');
const {
  callProvider,
  reMapPassengersInRequestBody
} = require('../utils/flightUtils');
const { offerPriceRQ } = require('./offerPrice');

module.exports = async (offer, requestBody, guaranteeClaim) => {

  if (!offer.isPriced) {
    const offerPriceResult = await offerPriceRQ(
      requestBody.offerId,
      requestBody,
      false
    );

    if (offerPriceResult.offer.price.public !== offer.amountAfterTax) {
      throw new GliderError(
        'Offer price has changed, reprice is required',
        502
      );
    }
  }

  let ndcRequestHeaderData;
  let ndcRequestData;
  let providerUrl;
  let apiKey;
  let SOAPAction;
  let ndcBody;
  let responseTransformTemplate;
  let errorsTransformTemplate;
  let faultsTransformTemplate;

  // Check the type of request: OneWay or Return
  let requestDocumentId = 'OneWay';

  if (offer.isReturnTrip) {
    requestDocumentId = 'Return';
  }

  switch (offer.provider) {
    case 'AF':
      requestBody = reMapPassengersInRequestBody(offer, requestBody);
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
      ndcRequestHeaderData = mapNdcRequestHeaderData_AC(guaranteeClaim);
      ndcRequestData = mapNdcRequestData_AC(
        airCanadaConfig,
        offer,
        requestBody,
        guaranteeClaim,
        requestDocumentId
      );
      providerUrl = 'https://pci.ndchub.mconnect.aero/messaging/v2/ndc-exchange/OrderCreate';
      apiKey = airCanadaConfig.apiKey;
      ndcBody = orderCreateRequestTemplate_AC(ndcRequestHeaderData, ndcRequestData);
      responseTransformTemplate = provideOrderCreateTransformTemplate_AC;
      errorsTransformTemplate = ErrorsTransformTemplate_AC;
      faultsTransformTemplate = FaultsTransformTemplate_AC;
      break;
    default:
      throw new GliderError(
        'Unsupported flight operator',
        400
      );
  }

  // console.log('BODY@@@', ndcBody); 

  const { response, error } = await callProvider(
    offer.provider,
    providerUrl,
    apiKey,
    ndcBody,
    SOAPAction
  );

  // console.log('RESP0NSE@@@', response.data); 

  if (error && !error.isAxiosError) {
    
    throw new GliderError(
      error.message,
      502
    );
  }

  let faultsResult;
  
  if (faultsTransformTemplate) {
    await ready();
    faultsResult = await transform(response.data, faultsTransformTemplate);
  }

  // Attempt to parse as a an error
  await ready();
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

  // Otherwise parse as a result
  await ready();
  const createResults = await transform(
    response.data,
    responseTransformTemplate
  );

  createResults.order.itinerary.segments = mergeHourAndDate(
    createResults.order.itinerary.segments
  );

  createResults.order.itinerary.segments = createResults.order.itinerary.segments
    .map(s => {
      const operator = s.operator;
      operator.iataCode = operator.iataCode ? operator.iataCode : operator.iataCodeM;
      operator.flightNumber =
        `${operator.iataCodeM}${String(operator.flightNumber).padStart(4, '0')}`;
      delete operator.iataCodeM;
      return s;
    });

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

  if (guaranteeClaim &&
      createResults.travelDocuments &&
      Array.isArray(createResults.travelDocuments.bookings) &&
      createResults.travelDocuments.bookings.length > 0) {
    
    createResults.travelDocuments.etickets = reduceToObjectByKey(
      createResults.travelDocuments.etickets
    );
  
    createResults.travelDocuments.etickets = reduceToProperty(
      createResults.travelDocuments.etickets,
      '_passenger_'
    );
  } else {
    delete createResults.travelDocuments;
  }

  delete createResults.order.contactList;

  createResults.order.options = offer.extraData.options;
  
  return createResults;
};
