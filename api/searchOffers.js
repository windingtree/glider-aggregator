const { transform } = require('camaro');
const axios = require('axios');
const { mapNdcRequestData } = require('../helpers/transformInputData/searchOffers');
const { provideAirShoppingRequestTemplate } = require('../helpers/soapTemplates/searchOffers');
const { provideAirShoppingTransformTemplate, ErrorsTransformTemplate } = require('../helpers/camaroTemplates/provideAirShopping');
const { reduceToObjectByKey,
 roundCommissionDecimals,
 splitSegments,
 reduceToProperty,
 mergeHourAndDate,
 useDictionary,
} = require('../helpers/parsers');
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
    const { errors } = await transform(response.data, ErrorsTransformTemplate);
    if (errors.length) throw new Error(`${errors[0].message}`);

    const searchResults = await transform(response.data, provideAirShoppingTransformTemplate);
    searchResults.itineraries[0].segments = 
      mergeHourAndDate(searchResults.itineraries[0].segments, 'splittedDepartureDate', 'splittedDepartureTime', 'departureTime');
    searchResults.itineraries[0].segments = 
      mergeHourAndDate(searchResults.itineraries[0].segments, 'splittedArrivalDate', 'splittedArrivalTime', 'arrivalTime');
    searchResults.itineraries[0].segments = reduceToObjectByKey(searchResults.itineraries[0].segments);
    
    searchResults.itineraries[0].combinations = splitSegments(searchResults.itineraries[0].combinations);
    searchResults.itineraries[0].combinations = reduceToObjectByKey(searchResults.itineraries[0].combinations);
    searchResults.itineraries[0].combinations = reduceToProperty(searchResults.itineraries[0].combinations, '_items_');

    for (const offer of Object.values(searchResults.offers)) {
      offer.offerItems = reduceToObjectByKey(offer.offerItems);
      offer.offerItems =  reduceToProperty(offer.offerItems, '_value_');
    }

    searchResults.offers = roundCommissionDecimals(searchResults.offers);
    searchResults.offers = reduceToObjectByKey(searchResults.offers);
    searchResults.passengers = reduceToObjectByKey(searchResults.passengers);
    searchResults.checkedBaggages = reduceToObjectByKey(searchResults.checkedBaggages);
    searchResults.serviceClasses = useDictionary(searchResults.serviceClasses, searchResults.checkedBaggages, 'checkedBaggages');
    searchResults.serviceClasses = reduceToObjectByKey(searchResults.serviceClasses);

    delete searchResults.checkedBaggages;

    res.status(200).json(searchResults);
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