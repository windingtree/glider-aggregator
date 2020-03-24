const axios = require('axios');
const { transform } = require('camaro');
const { basicDecorator } = require('../../../../decorators/basic');
const GliderError = require('../../../../helpers/error');
const config = require('../../../../config');
const { ordersManager } = require('../../../..//helpers/models/order');
const { mapNdcRequestData } = require('../../../../helpers/transformInputData/fulfillOrder');
const { fulfillOrderTemplate } = require('../../../../helpers/soapTemplates/fulfillOrder');
const {
  ErrorsTransformTemplate,
  fulfillOrderTransformTemplate
} = require('../../../../helpers/camaroTemplates/fulfillOrder');
const {
  reduceToObjectByKey,
  reduceToProperty
} = require('../../../../helpers/parsers');
const { getGuarantee, claimGuarantee } = require('../../../../helpers/guarantee');

module.exports = basicDecorator(async (req, res) => {
  const { body, query } = req;

  // Get the order
  const storedOrder = await ordersManager.getOrder(query.orderId);
  
  // Get the guarantee and verify
  const guarantee = await getGuarantee(body.guaranteeId, {
    currency: storedOrder.order.order.price.currency,
    amountAfterTax: storedOrder.order.order.price.public
  });

  const ndcRequestData = mapNdcRequestData(body, query);
  const ndcBody = fulfillOrderTemplate(ndcRequestData);

  const response = await axios.post(
    'https://ndc-rct.airfranceklm.com/passenger/distribmgmt/001489v01/EXT',
    ndcBody,
    {
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        'Accept-Encoding': 'gzip,deflate',
        SOAPAction: '"http://www.af-klm.com/services/passenger/AirDocIssue/airDocIssue"',
        'api_key': config.airFranceConfig.apiKey,
      },
    }
  );

  const { errors } = await transform(response.data, ErrorsTransformTemplate);

  if (errors.length) {
    throw new GliderError(`${errors[0].message}`, 502);
  }

  const fulfillResults = await transform(response.data, fulfillOrderTransformTemplate);

  fulfillResults.travelDocuments.etickets = reduceToObjectByKey(
    fulfillResults.travelDocuments.etickets
  );
  fulfillResults.travelDocuments.etickets = reduceToProperty(
    fulfillResults.travelDocuments.etickets,
    '_passenger_'
  );

  // Claim the guarantee
  const guaranteeClaim = await claimGuarantee(body.guaranteeId);

  await ordersManager.saveOrder(
    body.orderId,
    {
      request: body,
      guarantee: guarantee,
      guaranteeClaim: guaranteeClaim,
      order: fulfillResults
    }
  );

  res.status(200).json(fulfillResults);
});
