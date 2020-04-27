const { transform } = require('camaro');
const GliderError = require('../../error');
const assertErrors = require('../utils/assertResponseErrors');
const {
  mergeHourAndDate,
  reduceToObjectByKey
} = require('../../parsers');
const { airCanadaConfig } = require('../../../config');
const {
  offerManager,
  FlightOffer
} = require('../../models/offer');
const {
  callProvider
} = require('../../resolvers/utils/flightUtils');
const {
  mapNdcRequestData_AC
} = require('../../transformInputData/offerPrice');
const {
  offerPriceRequestTemplate_AC
} = require('../../soapTemplates/offerPrice');
const {
  provideOfferPriceTransformTemplate_AC,
  FaultsTransformTemplate_AC,
  ErrorsTransformTemplate_AC
} = require('../../camaroTemplates/provideOfferPrice');

// Convert response data to the object form
const processResponse = async (data, template) => {
  const offerResult = await transform(
    data,
    template
  );

  if (!offerResult.offer.expiration.match(/Z$/)) {
    offerResult.offer.expiration = offerResult.offer.expiration + 'Z';
  }
  
  offerResult.offer.itinerary.segments = mergeHourAndDate(
    offerResult.offer.itinerary.segments
  );
  offerResult.offer.itinerary.segments = reduceToObjectByKey(
    offerResult.offer.itinerary.segments
  );
  offerResult.offer.services = reduceToObjectByKey(
    offerResult.offer.services
  );
  offerResult.offer.price.commission =
    offerResult.offer.price.commission.reduce(
      (total, { value }) => total + parseFloat(value),
      0
    ).toFixed(2);
  offerResult.offer.price.taxes =
    offerResult.offer.price.taxes.reduce(
      (total, { value }) => total + parseFloat(value),
      0
    ).toFixed(2);
  offerResult.offer.passengers = reduceToObjectByKey(
    offerResult.offer.passengers
  );

  return offerResult;
};

// Create a OfferPrice request
const offerPriceRQ = async (offerId, offerUpdateRequired = true) => {

  let offerResult;
  let ndcRequestData;
  let providerUrl;
  let apiKey;
  let ndcBody;
  let responseTransformTemplate;
  let errorsTransformTemplate;
  let faultsTransformTemplate;
  let SOAPAction;
  
  if (!offerId) {
    throw new GliderError(
      'Missing mandatory field: offerId',
      400
    );
  }

  // Retrieve the offer
  const offer = await offerManager.getOffer(offerId);

  if (offer instanceof FlightOffer) {

    switch (offer.provider) {
      case 'AF':
        throw new GliderError(
          'Not implemented yet',
          500
        );
      case 'AC':
        ndcRequestData = mapNdcRequestData_AC(airCanadaConfig, offer);
        providerUrl = 'https://ndchub.mconnect.aero/messaging/v2/ndc-exchange/OfferPrice';
        apiKey = airCanadaConfig.apiKey;
        ndcBody = offerPriceRequestTemplate_AC(ndcRequestData);
        // console.log('@@@', ndcBody);
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
      offer.provider,
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

    offerResult = await processResponse(
      response.data,
      responseTransformTemplate
    );

    // Re-map offer Id to internal Id
    offerResult.offerId = offerId;

    // Re-map passengers to internal Ids
    const newPassengersMap = {};
    offerResult.offer.passengers = Object.entries(offerResult.offer.passengers)
      .reduce((a, v) => {
        const pNumber = v[0].split('-')[1];
        for (const m in offer.extraData.mappedPassengers) {
          const pNumberMapped = offer.extraData.mappedPassengers[m].split('-')[1];
          if (pNumber === pNumberMapped) {
            a[m] = v[1];
            newPassengersMap[m] = v[0];
          }
        }
        return a;
      }, {});

    // Update offer in the database
    if (offerUpdateRequired) {
      offer.isPriced = true;
      offer.amountAfterTax = offerResult.offer.price.public;
      offer.offerId = offerId;
      offer.extraData.mappedPassengers = newPassengersMap;
      await offerManager.saveOffer(offerId, {
        offer
      });
    }
  } else {
    throw new GliderError(
      'Offer not found',
      400
    );
  }

  return offerResult;
};

module.exports.offerPriceRQ = offerPriceRQ;
