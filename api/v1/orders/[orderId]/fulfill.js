const { transform } = require('camaro');
const { basicDecorator } = require('../../../../decorators/basic');
const GliderError = require('../../../../helpers/error');
const {
  airFranceConfig,
  airCanadaConfig
} = require('../../../../config');
const { ordersManager } = require('../../../..//helpers/models/order');
const {
  mapNdcRequestData_AF,
  mapNdcRequestHeaderData_AC,
  mapNdcRequestData_AC
} = require('../../../../helpers/transformInputData/fulfillOrder');
const {
  fulfillOrderTemplate_AF,
  fulfillOrderTemplate_AC
} = require('../../../../helpers/soapTemplates/fulfillOrder');
const {
  ErrorsTransformTemplate_AF,
  ErrorsTransformTemplate_AC,
  FaultsTransformTemplate_AC,
  fulfillOrderTransformTemplate_AF,
  fulfillOrderTransformTemplate_AC
} = require('../../../../helpers/camaroTemplates/fulfillOrder');
const {
  reduceToObjectByKey,
  reduceToProperty
} = require('../../../../helpers/parsers');
const {
  getGuarantee,
  claimGuarantee,
  claimGuaranteeWithCard
} = require('../../../../helpers/guarantee');
const {
  callProvider
} = require('../../../../helpers/resolvers/utils/flightUtils');

module.exports = basicDecorator(async (req, res) => {
  const { body, query } = req;
  let guaranteeClaim;

  // Get the order
  const order = await ordersManager.getOrder(query.orderId);

  // Get the guarantee and verify
  const guarantee = await getGuarantee(body.guaranteeId, {
    currency: order.order.order.price.currency,
    amountAfterTax: order.order.order.price.public
  });

  let ndcRequestHeaderData;
  let ndcRequestData;
  let providerUrl;
  let apiKey;
  let SOAPAction;
  let ndcBody;
  let responseTransformTemplate;
  let errorsTransformTemplate;
  let faultsTransformTemplate;

  switch (order.provider) {
    case 'AF':
      ndcRequestData = mapNdcRequestData_AF(airFranceConfig, body, query);
      providerUrl = 'https://ndc-rct.airfranceklm.com/passenger/distribmgmt/001489v01/EXT';
      apiKey = airFranceConfig.apiKey;
      SOAPAction = '"http://www.af-klm.com/services/passenger/AirDocIssue/airDocIssue"';
      ndcBody = fulfillOrderTemplate_AF(ndcRequestData);
      responseTransformTemplate = fulfillOrderTransformTemplate_AF;
      errorsTransformTemplate = ErrorsTransformTemplate_AF;
      faultsTransformTemplate = null;
      break;
    case 'AC':
      guaranteeClaim = await claimGuaranteeWithCard(body.guaranteeId);
      ndcRequestHeaderData = mapNdcRequestHeaderData_AC(guaranteeClaim);
      ndcRequestData = mapNdcRequestData_AC(airCanadaConfig, order, body, guaranteeClaim);
      providerUrl = 'https://pci.ndchub.mconnect.aero/messaging/v2/ndc-exchange/OrderCreate';
      apiKey = airCanadaConfig.apiKey;
      ndcBody = fulfillOrderTemplate_AC(ndcRequestHeaderData, ndcRequestData);
      // console.log('@@@', ndcBody);
      responseTransformTemplate = fulfillOrderTransformTemplate_AC;
      errorsTransformTemplate = ErrorsTransformTemplate_AC;
      faultsTransformTemplate = FaultsTransformTemplate_AC;
      break;
    default:
      return Promise.reject('Unsupported flight operator');
  }

  const { response, error } = await callProvider(
    order.provider,
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
  } else if (error) {
    throw new GliderError(
      error.message,
      502
    );
  }

  const fulfillResults = await transform(
    response.data,
    responseTransformTemplate
  );

  fulfillResults.travelDocuments.etickets = reduceToObjectByKey(
    fulfillResults.travelDocuments.etickets
  );

  fulfillResults.travelDocuments.etickets = reduceToProperty(
    fulfillResults.travelDocuments.etickets,
    '_passenger_'
  );

  if (!guaranteeClaim) {
    guaranteeClaim = await claimGuarantee(body.guaranteeId);
  }

  await ordersManager.saveOrder(
    body.orderId,
    {
      request: body,
      guarantee: guarantee,
      guaranteeClaim: guaranteeClaim,
      order: fulfillResults,
      offer: order.offer
    }
  );

  res.status(200).json(fulfillResults);
});
