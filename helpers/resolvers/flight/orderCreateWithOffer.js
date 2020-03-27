const axios = require('axios');
const { transform } = require('camaro');
const config = require('../../../config');
const GliderError = require('../../error');

const { mapNdcRequestData } = require('../../transformInputData/createOrder');
const { orderCreateRequestTemplate } = require('../../soapTemplates/createOrder');
const {
  provideOrderCreateTransformTemplate,
  ErrorsTransformTemplate
} = require('../../camaroTemplates/provideOrderCreate');

const {
  mergeHourAndDate,
  reduceToObjectByKey,
  useDictionary,
  reduceContactInformation,
  splitPropertyBySpace
} = require('../../parsers');

module.exports = async (requestBody) => {

  const ndcRequestData = mapNdcRequestData(requestBody);
  const ndcBody = orderCreateRequestTemplate(ndcRequestData);
  const response = await axios
    .post(
      'https://ndc-rct.airfranceklm.com/passenger/distribmgmt/001451v01/EXT',
      ndcBody, {
        headers: {
          'Content-Type': 'text/xml;charset=UTF-8',
          'Accept-Encoding': 'gzip,deflate',
          SOAPAction: '"http://www.af-klm.com/services/passenger/ProvideOrderCreate/provideOrderCreate"',
          'api_key': config.airFranceConfig.apiKey,
        },
      }
    );
  
  // Attempt to parse as a an error
  const { errors } = await transform(response.data, ErrorsTransformTemplate);

  // If an error is found, stop here
  if (errors.length) {
    throw new GliderError(
      errors.map((e => e.message).join('; ')),
      502
    );
  }

  // Otherwise parse as a result
  const createResults = await transform(response.data, provideOrderCreateTransformTemplate);

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
