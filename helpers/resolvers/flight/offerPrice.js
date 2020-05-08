const { transform } = require('camaro');
const { v4: uuidv4 } = require('uuid');
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

  offerResult.offer.priceClassList = reduceToObjectByKey(
    offerResult.offer.priceClassList.map(item => ({
      ...item,
      ...({
        description: item.description.join('\n')
      })
    }))
  );

  offerResult.offer.pricedItems.map(item => {
    item.fareBase.components = item.fareBase.components.map(c => ({
      ...c,
      ...({
        conditions: offerResult.offer.priceClassList[c.conditions].description
      })
    }));

    item.fare = [
      item.fareBase,
      ...item.fareSurcharge
    ];

    delete item.fareBase;
    delete item.fareSurcharge;

    return item;
  });

  // offerResult.offer.pricedItems = reduceToObjectByKey(
  //   offerResult.offer.pricedItems
  // );

  offerResult.offer.terms = offerResult.offer.terms.join('\n');
  
  offerResult.offer.itinerary.segments = mergeHourAndDate(
    offerResult.offer.itinerary.segments
  );
  offerResult.offer.itinerary.segments = reduceToObjectByKey(
    offerResult.offer.itinerary.segments
  );
  offerResult.offer.services = reduceToObjectByKey(
    offerResult.offer.services
  );

  // offerResult.offer.price.commission =
  //   offerResult.offer.price.commission.reduce(
  //     (total, { value }) => total + parseFloat(value),
  //     0
  //   ).toFixed(2);

  offerResult.offer.price.taxes =
    offerResult.offer.price.taxes.reduce(
      (total, { value }) => total + parseFloat(value),
      0
    ).toFixed(2);
  offerResult.offer.passengers = reduceToObjectByKey(
    offerResult.offer.passengers
  );

  delete offerResult.offer.priceClassList;

  return offerResult;
};

// Create a OfferPrice request
module.exports.offerPriceRQ = async (offerIds, offerUpdateRequired = true) => {

  let offerResult;
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
  const offers = (await Promise.all(offerIds.map(
    offerId => offerManager.getOffer(offerId)
  )))
    // Should be FlightOffer of type and have same provider
    .filter((offer, i, array) => (
      offer instanceof FlightOffer &&
      offer.provider === array[0].provider
    ));

  if (offers.length === 0) {
    throw new GliderError(
      'Offer not found',
      400
    );
  }

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
      providerUrl = 'https://ndchub.mconnect.aero/messaging/v2/ndc-exchange/OfferPrice';
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

  offerResult = await processResponse(
    response.data,
    responseTransformTemplate
  );

  // console.log('###', JSON.stringify(offerResult, null, 2));

  if (offers.length === 1) {
    offerResult.offerId = offerIds[0];

    // Re-map offer Id to internal Id
    const newPassengersMap = {};
    offers[0].passengers = Object.entries(offerResult.offer.passengers)
      .reduce((a, v) => {
        const pNumber = v[0].split('-')[1];
        for (const m in offers[0].extraData.mappedPassengers) {
          const pNumberMapped = offers[0].extraData.mappedPassengers[m].split('-')[1];
          if (pNumber === pNumberMapped) {
            a[m] = v[1];
            newPassengersMap[m] = v[0];
          }
        }
        return a;
      }, {});

    if (offerUpdateRequired) {
      offers[0].isPriced = true;
      offers[0].amountAfterTax = offerResult.offer.price.public;
      offers[0].offerId = offerResult.offerId;
      offers[0].extraData.mappedPassengers = newPassengersMap;
      await offerManager.saveOffer(offerResult.offerId, {
        offer: offers[0]
      });
    }
  } else {
    const internalOfferId = uuidv4();
    offerResult.offerId = internalOfferId;

    // Save new priced offer
    const offer = new FlightOffer(
      offers[0].provider,
      offers[0].provider,
      offerResult.offer.expiration,
      reduceToObjectByKey(
        offerResult.offer.pricedItems
      ),
      offerResult.offer.price.public,
      offerResult.offer.price.currency,
      {
        segments: offerResult.offer.itinerary.segments
      }
    );
    offer.offerId = internalOfferId;
    offer.isPriced = true;
    await offerManager.saveOffer(internalOfferId, {
      offer
    });
  }

  offerResult.offer.pricedItems = offerResult.offer.pricedItems.map(item => {
    delete item._id_;
    return item;
  });

  return offerResult;
};
