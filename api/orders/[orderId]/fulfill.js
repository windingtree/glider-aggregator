const axios = require('axios');
const { transform } = require('camaro');
const { airFranceConfig } = require('../../../config');
const { mapNdcRequestData}  = require('../../../helpers/transformInputData/fulfillOrder');
const { fulfillOrderTemplate } = require('../../../helpers/soapTemplates/fulfillOrder');
const { ErrorsTransformTemplate, fulfillOrderTransformTemplate } = require('../../../helpers/camaroTemplates/fulfillOrder');
const { reduceToObjectByKey, reduceToProperty } = require('../../../helpers/parsers')
module.exports = async (req, res) => {
  try {
    const { body, query } = req;
    
    const ndcRequestData = mapNdcRequestData(body, query);
    const ndcBody = fulfillOrderTemplate(ndcRequestData);
    const response = await axios.post('https://ndc-rct.airfranceklm.com/passenger/distribmgmt/001489v01/EXT',
    ndcBody,
      {
        headers: {
          'Content-Type': 'text/xml;charset=UTF-8',
          'Accept-Encoding': 'gzip,deflate',
          SOAPAction: '"http://www.af-klm.com/services/passenger/AirDocIssue/airDocIssue"',
          api_key: airFranceConfig.apiKey,
        },
      });
    
    const { errors } = await transform(response.data, ErrorsTransformTemplate);
    if (errors.length) throw new Error(`${errors[0].message}`);
    
    const fulfillResults = await transform(response.data, fulfillOrderTransformTemplate);
    
    fulfillResults.travelDocuments.etickets = reduceToObjectByKey(fulfillResults.travelDocuments.etickets);
    fulfillResults.travelDocuments.etickets = reduceToProperty(fulfillResults.travelDocuments.etickets, '_passenger_');
    
    res.status(200).json(fulfillResults);
  } catch (e) {
    console.log(e);

    const message = e instanceof TypeError 
      ? 'Something is missing in body. Check ' + e.message.split(' ')[3]
      : e.message;
    res.status(500).json({
      message,
    });
  }
};