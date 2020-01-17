const { transform } = require('camaro');
const axios = require('axios');
const { mapNdcRequestData } = require('../helpers/searchOffers/mapNdcRequestData.js');
const { provideAirShoppingRequestTemplate } = require('../helpers/searchOffers/xmlTemplates.js');
const { provideAirShoppingTransformTemplate } = require('../helpers/searchOffers/transformTemplates');
const { segmentsByKey, roundCommissionDecimals } = require('../helpers/searchOffers/parsers');
const { airFranceConfig } = require('../config.js');

module.exports = async (req, res) => {
  const { itinerary } = req.body;

  try {
    const ndcRequestData = mapNdcRequestData(itinerary);
    const body = provideAirShoppingRequestTemplate(ndcRequestData);
    const response = await axios.post('https://ndc-rct.airfranceklm.com/passenger/distribmgmt/001448v01/EXT',
      body,
      {
        headers: {
          'Content-Type': 'text/xml;charset=UTF-8',
          'Accept-Encoding': 'gzip,deflate',
          SOAPAction: '"http://www.af-klm.com/services/passenger/ProvideAirShopping/provideAirShopping"',
          api_key: airFranceConfig.apiKey,
        },
      });
    const searchResults = await transform(response.data, provideAirShoppingTransformTemplate);
    searchResults.itineraries[0].segments = segmentsByKey(searchResults.itineraries[0].segments);
    searchResults.offers = roundCommissionDecimals(searchResults.offers);
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