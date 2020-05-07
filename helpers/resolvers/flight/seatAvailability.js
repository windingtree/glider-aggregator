const {
  transform
} = require('camaro');
const GliderError = require('../../error');
const { airCanadaConfig } = require('../../../config');
const assertErrors = require('../utils/assertResponseErrors');
const {
  callProvider,
  fetchFlightsOffersByIds
} = require('../utils/flightUtils');
const {
  mapNdcRequestData_AC
} = require('../../transformInputData/seatAvailability');
const {
  offerPriceRequestTemplate_AC
} = require('../../soapTemplates/seatAvailability');
const {
  provideOfferPriceTransformTemplate_AC,
  FaultsTransformTemplate_AC,
  ErrorsTransformTemplate_AC
} = require('../../camaroTemplates/provideSeatAvailability');

// Convert response data to the object form
const processResponse = async (data, template) => {
  const seatMapResult = await transform(
    data,
    template
  );
  
};

// Create a SeatMap request
module.exports.seatMapRQ = async (offerIds) => {
  let seatMapResult;
  let ndcRequestData;
  let providerUrl;
  let apiKey;
  let ndcBody;
  let responseTransformTemplate;
  let errorsTransformTemplate;
  let faultsTransformTemplate;
  let SOAPAction;

  if (!offerIds) {
    throw new GliderError(
      'Missing mandatory field: offerIds',
      400
    );
  }

  // Convert incoming Ids into list
  offerIds = offerIds.split(',').map(o => o.trim());

  // Retrieve the offers
  const offers = await fetchFlightsOffersByIds(offerIds);

  switch (offers[0].provider) {
    case 'AF':
      throw new GliderError(
        'Not implemented yet',
        500
      );
    case 'AC':
      ndcRequestData = mapNdcRequestData_AC(airCanadaConfig, offers);
      providerUrl = 'https://pci.ndchub.mconnect.aero/messaging/v2/ndc-exchange/SeatAvailability';
      apiKey = airCanadaConfig.apiKey;
      ndcBody = offerPriceRequestTemplate_AC(ndcRequestData);
      // console.log('###', ndcBody);
      responseTransformTemplate = provideOfferPriceTransformTemplate_AC;
      errorsTransformTemplate = ErrorsTransformTemplate_AC;
      faultsTransformTemplate = FaultsTransformTemplate_AC;
      break;
    default:
      throw new GliderError(
        'Unsupported flight operator',
        400
      );
  }

  const { response, error } = await callProvider(
    offers[0].provider,
    providerUrl,
    apiKey,
    ndcBody,
    SOAPAction
  );

  await assertErrors(
    error,
    response,
    faultsTransformTemplate,
    errorsTransformTemplate
  );

  // console.log('@@@', response.data);

  seatMapResult = await processResponse(
    response.data,
    responseTransformTemplate
  );

  // console.log('###', JSON.stringify(seatMapResult, null, 2));

  return seatMapResult;
};
