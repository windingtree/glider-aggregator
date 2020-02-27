const axios = require('axios');
const { transform } = require('camaro');
//const { airFranceConfig, JWT } = require('../../../../config');
const config = require('../../../../config');
const { basicDecorator } = require('../../../../decorators/basic');
const { mapNdcRequestData}  = require('../../../../helpers/transformInputData/fulfillOrder');
const { fulfillOrderTemplate } = require('../../../../helpers/soapTemplates/fulfillOrder');
const { ErrorsTransformTemplate, fulfillOrderTransformTemplate } = require('../../../../helpers/camaroTemplates/fulfillOrder');
const { reduceToObjectByKey, reduceToProperty } = require('../../../../helpers/parsers');

const simardHeaders = {
  Authorization: config.JWT,
}

module.exports = basicDecorator(async (req, res) => {
  const { body, query, headers } = req;
  const guaranteeResponse = await axios.get(`https://staging.simard.windingtree.net/api/v1/balances/guarantees/${body.guaranteeId}`,
    {
      headers: simardHeaders,
    },
  );
  // Missing validations on guaranteeResponse
  const ndcRequestData = mapNdcRequestData(body, query);
  const ndcBody = fulfillOrderTemplate(ndcRequestData);
  const response = await axios.post('https://ndc-rct.airfranceklm.com/passenger/distribmgmt/001489v01/EXT',
  ndcBody,
    {
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        'Accept-Encoding': 'gzip,deflate',
        SOAPAction: '"http://www.af-klm.com/services/passenger/AirDocIssue/airDocIssue"',
        api_key: config.airFranceConfig.apiKey,
      },
    });
  
  const { errors } = await transform(response.data, ErrorsTransformTemplate);
  if (errors.length) throw new Error(`${errors[0].message}`);
  
  const fulfillResults = await transform(response.data, fulfillOrderTransformTemplate);
  
  fulfillResults.travelDocuments.etickets = reduceToObjectByKey(fulfillResults.travelDocuments.etickets);
  fulfillResults.travelDocuments.etickets = reduceToProperty(fulfillResults.travelDocuments.etickets, '_passenger_');

  const guarantreeClaim = await axios.post(`https://staging.simard.windingtree.net/api/v1/balances/guarantees/${body.guaranteeId}/claim`,
    {},
    {
      headers: simardHeaders,
    },
  );

  res.status(200).json(fulfillResults);
});