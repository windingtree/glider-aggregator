const { assertAmadeusFault } = require('../../amadeus/errors');
const { seatmapResponseProcessor } = require('../../amadeus/seatmap/seatmapResponseProcessor');

const { callProviderRest } = require('../utils/flightUtils');
const { seatmapRequestTemplate } = require('../../amadeus/seatmap/seatmapRequestTemplate');

const { transform } = require('camaro');
const GliderError = require('../../error');
const { logRQRS } = require('../../amadeus/logRQ');
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
  logRQRS(data,'seatmap-NDC-response-3-data');
  logRQRS(offers,'seatmap-NDC-response-3-offers');
  // Index segments from offers
  const indexedSegments = flatOneDepth(
    offers.map(offer => offer.extraData.segments.map(s => ({
      [`${s.Departure.AirportCode}-${s.Arrival.AirportCode}`]: s.id
    })))
  ).reduce((a, v) => ({ ...a, ...v }), {});
  logRQRS(indexedSegments,'seatmap-NDC-response-3-indexedSegments');
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
    const prices = {};
    v.cabins = v.cabins.map(c => {
      c.seats = flatOneDepth(
        c.rows.map(r => r.seats.map(s => ({
          ...s,
          ...({
            number: `${r.number}${s.number}`
          }),
          ...({
            optionCode: seatMapResult.offers.reduce((acc, val) => {
              if (val.offerItems[s.optionCode]) {
                const serviceRef = val.offerItems[s.optionCode].serviceRef;
                acc = `${serviceRef}.${seatMapResult.services[serviceRef].name}`;
                prices[acc] = {
                  currency: val.offerItems[s.optionCode].currency,
                  public: val.offerItems[s.optionCode].public,
                  taxes: val.offerItems[s.optionCode].taxes
                };
              }
              return acc;
            }, undefined)
          })
        })))
      );
      delete c.rows;
      return c;
    });

    if (indexedSegments[v.segmentKey]) {
      a[indexedSegments[v.segmentKey]] = {
        cabins: v.cabins,
        prices
      };
    }

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
  let provider = offers[0].provider;
  switch (provider) {
    case 'AF':
      throw new GliderError(
        'Not implemented yet',
        500
      );
    case 'AC':
      ndcRequestData = mapNdcRequestData_AC(airCanadaConfig, offers, requestDocumentId);
      // console.log('@@@', JSON.stringify(ndcRequestData, null, 2));
      providerUrl = `${airCanadaConfig.baseUrlPci}/SeatAvailability`;
      apiKey = airCanadaConfig.apiKey;
      ndcBody = seatAvailabilityRequestTemplate_AC(ndcRequestData);
      // console.log('###', ndcBody);
      responseTransformTemplate = provideSeatAvailabilityTransformTemplate_AC;
      errorsTransformTemplate = ErrorsTransformTemplate_AC;
      faultsTransformTemplate = FaultsTransformTemplate_AC;
      break;
    case '1A':
      ndcBody=seatmapRequestTemplate(offers);
      break;
    default:
      throw new GliderError(
        'Unsupported flight operator',
        400
      );
  }
console.log('before callProviderRest')
  const { response, error } =  provider === '1A' ? await callProviderRest(provider,'','',ndcBody,'SEATMAP',''): await callProvider(offers[0].provider,providerUrl,apiKey,ndcBody,SOAPAction);
  console.log('after callProviderRest')
  provider === '1A' ? assertAmadeusFault(response, error) : await assertErrors(error,response,faultsTransformTemplate,errorsTransformTemplate);
  seatMapResult = provider === '1A'? seatmapResponseProcessor(response.result, offers):await processResponse(response.data,offers,responseTransformTemplate);

  return seatMapResult;
};
