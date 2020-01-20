const { transform } = require('camaro');
const axios = require('axios');
const { mapNdcRequestData } = require('../helpers/searchOffers/mapNdcRequestData.js');
const { provideAirShoppingRequestTemplate } = require('../helpers/searchOffers/xmlTemplates.js');
const { 
  provideAirShoppingTransformTemplate,
  provideAirShoppingErrorsTransformTemplate,
} = require('../helpers/searchOffers/transformTemplates');
const { reduceToObjectByKey,
 roundCommissionDecimals,
 splitSegments,
 reduceToProperty,
} = require('../helpers/searchOffers/parsers');
const { airFranceConfig } = require('../config.js');

module.exports = async (req, res) => {
  const requestBody = req.body;

  try {
    
    const ndcRequestData = mapNdcRequestData(requestBody);
    const ndcBody = provideAirShoppingRequestTemplate(ndcRequestData);
    const response = await axios.post('https://ndc-rct.airfranceklm.com/passenger/distribmgmt/001448v01/EXT',
    ndcBody,
      {
        headers: {
          'Content-Type': 'text/xml;charset=UTF-8',
          'Accept-Encoding': 'gzip,deflate',
          SOAPAction: '"http://www.af-klm.com/services/passenger/ProvideAirShopping/provideAirShopping"',
          api_key: airFranceConfig.apiKey,
        },
      });
    const { errors } = await transform(response.data, provideAirShoppingErrorsTransformTemplate);
    if (errors.length) throw new Error(`${errors[0].message}`);
    const searchResults = await transform(response.data, provideAirShoppingTransformTemplate);
    searchResults.itineraries[0].segments = reduceToObjectByKey(searchResults.itineraries[0].segments);
    searchResults.itineraries[0].combinations = splitSegments(searchResults.itineraries[0].combinations);
    searchResults.itineraries[0].combinations = reduceToObjectByKey(searchResults.itineraries[0].combinations);
    searchResults.itineraries[0].combinations = reduceToProperty(searchResults.itineraries[0].combinations, '_items_');
    searchResults.offers = roundCommissionDecimals(searchResults.offers);
    searchResults.offers = reduceToObjectByKey(searchResults.offers);
    searchResults.serviceClasses = reduceToObjectByKey(searchResults.serviceClasses);
    searchResults.passengers = reduceToObjectByKey(searchResults.passengers);
    res.status(200).json({
      searchResults,
    });
  } catch (e) {
    console.log(e);

    const message = e instanceof TypeError 
      ? 'Something is missing in body. Check ' + e.message.split(' ')[3]
      : e.message;
    res.status(500).json({
      message,
    });
  }
  
}