const { ready, transform } = require('camaro');
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
  seatAvailabilityRequestTemplate_AC
} = require('../../soapTemplates/seatAvailability');
const {
  provideSeatAvailabilityTransformTemplate_AC,
  FaultsTransformTemplate_AC,
  ErrorsTransformTemplate_AC
} = require('../../camaroTemplates/provideSeatAvailability');
const {
  reduceToObjectByKey
} = require('../../parsers');
const { flatOneDepth } = require('../../transformInputData/utils/collections');

// Convert response data to the object form
const processResponse = async (data, offers, template) => {

  // Index segments from offers
  const indexedSegments = flatOneDepth(
    offers.map(offer => offer.extraData.segments.map(s => ({
      [`${s.Departure.AirportCode}-${s.Arrival.AirportCode}`]: s.id
    })))
  ).reduce((a, v) => ({...a, ...v}), {});

  await ready();
  const seatMapResult = await transform(
    data,
    template
  );

  seatMapResult.services = reduceToObjectByKey(seatMapResult.services);

  seatMapResult.offers = seatMapResult.offers.map(o => {
    o.offerItems = reduceToObjectByKey(
      o.offerItems
    );
    return o;
  }); 

  seatMapResult.seatMaps = seatMapResult.seatMaps.reduce((a, v) => {
    v.cabins = v.cabins.map(c => {
      c.seats = flatOneDepth(
        c.rows.map(r => r.seats.map(s => ({
          ...s,
          ...({
            number: `${r.number}${s.number}`
          }), 
          ...({
            optionCode: seatMapResult.offers.reduce((a, v) => {
              if (v.offerItems[s.optionCode]) {
                const serviceRef = v.offerItems[s.optionCode].serviceRef;
                a = `${serviceRef}.${seatMapResult.services[serviceRef].name}`;
              }              
              return a;
            }, undefined)
          })
        })))
      );
      delete c.rows;
      return c;
    });
    a[indexedSegments[v.segmentKey]] = {
      cabins: v.cabins
    };
    return a;
  }, {});

  return seatMapResult.seatMaps;
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

  // Check the type of request: OneWay or Return
  let requestDocumentId = 'OneWay';

  if (offers.length > 1) {
    requestDocumentId = 'Return';
  }

  switch (offers[0].provider) {
    case 'AF':
      throw new GliderError(
        'Not implemented yet',
        500
      );
    case 'AC':
      ndcRequestData = mapNdcRequestData_AC(airCanadaConfig, offers, requestDocumentId);
      // console.log('@@@', JSON.stringify(ndcRequestData, null, 2));
      providerUrl = 'https://pci.ndchub.mconnect.aero/messaging/v2/ndc-exchange/SeatAvailability';
      apiKey = airCanadaConfig.apiKey;
      ndcBody = seatAvailabilityRequestTemplate_AC(ndcRequestData);
      // console.log('###', ndcBody);
      responseTransformTemplate = provideSeatAvailabilityTransformTemplate_AC;
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

  // console.log('!!!!', error);

  await assertErrors(
    error,
    response,
    faultsTransformTemplate,
    errorsTransformTemplate
  );

  // console.log('@@@', response.data);

  seatMapResult = await processResponse(
    response.data,
    offers,
    responseTransformTemplate
  );

  // console.log('###', JSON.stringify(seatMapResult, null, 2));

  return seatMapResult;
};
