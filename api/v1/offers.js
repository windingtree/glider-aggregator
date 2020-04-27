const { transform } = require('camaro');
const GliderError = require('../../helpers/error');
const { basicDecorator } = require('../../decorators/basic');
const { airCanadaConfig } = require('../../config');
const {
  offerManager,
  FlightOffer
} = require('../../helpers/models/offer');
const {
  callProvider,
  reMapPassengersInRequestBody
} = require('../../helpers/resolvers/utils/flightUtils');
const {
  mapNdcRequestData_AC
} = require('../../helpers/transformInputData/offerPrice');
const {
  offerPriceRequestTemplate_AC
} = require('../../helpers/soapTemplates/offerPrice');
const {
  provideOfferPriceTransformTemplate_AC,
  FaultsTransformTemplate_AC,
  ErrorsTransformTemplate_AC
} = require('../../helpers/camaroTemplates/provideOfferPrice');
const {
  mergeHourAndDate,
  reduceToObjectByKey
} = require('../../helpers/parsers');

const assertErrors = async (
  error,
  response,
  faultsTransformTemplate,
  errorsTransformTemplate
) => {

  if (error && !error.isAxiosError) {
    
    throw new GliderError(
      error.message,
      502
    );
  }

  let faultsResult;

  if (faultsTransformTemplate) {
    faultsResult = await transform(response.data, faultsTransformTemplate);
  }

  // Attempt to parse as a an error
  const errorsResult = await transform(response.data, errorsTransformTemplate);

  // Because of two types of errors can be returned: NDCMSG_Fault and Errors
  const combinedErrors = [
    ...(faultsResult ? faultsResult.errors : []),
    ...errorsResult.errors
  ];

  // If an error is found, stop here
  if (combinedErrors.length) {
    throw new GliderError(
      combinedErrors.map(e => e.message).join('; '),
      502
    );
  } else if (error) {
    throw new GliderError(
      error.message,
      502
    );
  }
};

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

module.exports = basicDecorator(async (req, res) => {
  const { method, query, body } = req;

  if (method !== 'POST') {
    throw new GliderError(
      'Method not allowed',
      405
    );
  }

  let offerResult;
  let ndcRequestData;
  let providerUrl;
  let apiKey;
  let ndcBody;
  let responseTransformTemplate;
  let errorsTransformTemplate;
  let faultsTransformTemplate;
  let SOAPAction;
  
  if (!query.offerId) {
    throw new GliderError(
      'Missing mandatory field: offerId',
      400
    );
  }

  // Retrieve the offer
  const offer = await offerManager.getOffer(query.offerId);

  if (offer instanceof FlightOffer) {
    // Re-map passengers
    const requestBody = reMapPassengersInRequestBody(offer, body);

    switch (offer.provider) {
      case 'AF':
        throw new GliderError(
          'Not implemented yet',
          500
        );
      case 'AC':
        ndcRequestData = mapNdcRequestData_AC(airCanadaConfig, offer, requestBody);
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
    offerResult.offerId = query.offerId;

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
    offer.isPriced = true;
    offer.amountAfterTax = offerResult.offer.price.public;
    offer.offerId = query.offerId;
    offer.extraData.mappedPassengers = newPassengersMap;
    await offerManager.saveOffer(query.offerId, {
      offer
    });

  } else {
    throw new GliderError(
      'Offer not found',
      400
    );
  }

  res.status(200).json(offerResult);
});
