const FlightProviderNDCCommon = require('../ndc/flightProviderNDCCommon');
const { ndcRequest } = require('../ndc/ndcUtils');
const { airCanadaConfig } = require('../../../../config');
const { transform } = require('camaro');
const GliderError = require('../../../error');

// shopping templates
const { mapNdcRequestData_AC: mapNdcShoppingRequestData_AC } = require('./transformInputData/searchOffers');
const { provideShoppingRequestTemplate_AC } = require('./soapTemplates/searchOffers');
const {
  provideAirShoppingTransformTemplate_AC,
  ErrorsTransformTemplate_AC: ShoppingErrorsTransformTemplate_AC,
  FaultsTransformTemplate_AC: ShoppingFaultsTransformTemplate_AC,
} = require('./camaroTemplates/shoppingTemplate');

// pricing templates
const { mapNdcRequestData_AC: mapNdcOfferPriceRequestData_AC } = require('./transformInputData/offerPrice');
const { offerPriceRequestTemplate_AC } = require('./soapTemplates/offerPrice');
const {
  provideOfferPriceTransformTemplate_AC,
  FaultsTransformTemplate_AC: OfferPriceFaultsTransformTemplate_AC,
  ErrorsTransformTemplate_AC: OfferPriceErrorsTransformTemplate_AC,
} = require('./camaroTemplates/provideOfferPrice');

//order create templates
const {
  mapNdcRequestHeaderData_AC: mapNdcOfferCreateRequestHeaderData_AC,
  mapNdcRequestData_AC: mapNdcOfferCreateRequestData_AC,
} = require('./transformInputData/createOrder');
const {
  orderCreateRequestTemplate_AC,
} = require('./soapTemplates/createOrder');
const {
  provideOrderCreateTransformTemplate_AC,
  ErrorsTransformTemplate_AC: CreateOfferErrorsTransformTemplate_AC,
  FaultsTransformTemplate_AC: CreateOfferFaultsTransformTemplate_AC,
} = require('./camaroTemplates/provideOrderCreate');


const {
  dedupPassengersInOptions,
} = require('../../../resolvers/utils/flightUtils');
const {
  mergeHourAndDate, reduceToObjectByKey,
} = require('../../../parsers');

const assertErrors = require('../../../resolvers/utils/assertResponseErrors');
module.exports = class FlightProviderAC extends FlightProviderNDCCommon {
  constructor () {
    super();
  }

  async flightSearch (itinerary, passengers) {
    console.log('AC searching.....');
    let ndcRequestData;
    let providerUrl;
    let apiKey;
    let ndcBody;
    let body = { itinerary: itinerary, passengers: passengers };
    let requestDocumentId = this.detectRequestType(itinerary);
    ndcRequestData = mapNdcShoppingRequestData_AC(airCanadaConfig, body, requestDocumentId);
    providerUrl = `${airCanadaConfig.baseUrl}/AirShopping`;
    apiKey = airCanadaConfig.apiKey;
    ndcBody = provideShoppingRequestTemplate_AC(ndcRequestData);
    let { response } = await ndcRequest(providerUrl, apiKey, ndcBody);
    let faultsResult = await transform(response.data, ShoppingFaultsTransformTemplate_AC);
    let errorsResult = await transform(response.data, ShoppingErrorsTransformTemplate_AC);
    const combinedErrors = [
      ...(faultsResult ? faultsResult.errors : []),
      ...(errorsResult ? errorsResult.errors : []),
    ];

    let searchResults = await transform(response.data, provideAirShoppingTransformTemplate_AC);
    return { provider: this.getProviderID(), response: searchResults, errors: combinedErrors };
  }

  async priceOffers (body, offers) {
    // providerImpl.priceOffers
    let ndcRequestData;
    let providerUrl;
    let apiKey;
    let ndcBody;
    let responseTransformTemplate;
    let errorsTransformTemplate;
    let faultsTransformTemplate;
    // Check the type of request: OneWay or Return
    let requestDocumentId = (offers.length === 0) ? 'OneWay' : 'Return';
    ndcRequestData = mapNdcOfferPriceRequestData_AC(airCanadaConfig, offers, body, requestDocumentId);
    providerUrl = `${airCanadaConfig.baseUrl}/OfferPrice`;
    apiKey = airCanadaConfig.apiKey;
    ndcBody = offerPriceRequestTemplate_AC(ndcRequestData);
    responseTransformTemplate = provideOfferPriceTransformTemplate_AC;
    errorsTransformTemplate = OfferPriceErrorsTransformTemplate_AC;
    faultsTransformTemplate = OfferPriceFaultsTransformTemplate_AC;
    const { response, error } = await ndcRequest(providerUrl, apiKey, ndcBody);
    await assertErrors(error, response, faultsTransformTemplate, errorsTransformTemplate);
    let offerResult = await processOfferPriceResponse(response.data, responseTransformTemplate);
    return offerResult;
  };

  async orderCreate (offer, requestBody, guaranteeClaim) {

    let ndcRequestHeaderData;
    let ndcRequestData;
    let providerUrl;
    let apiKey;
    let SOAPAction;
    let ndcBody;
    let responseTransformTemplate;
    let errorsTransformTemplate;
    let faultsTransformTemplate;

    // Check the type of request: OneWay or Return
    let requestDocumentId = 'OneWay';

    if (offer.isReturnTrip) {
      requestDocumentId = 'Return';
    }
    ndcRequestHeaderData = mapNdcOfferCreateRequestHeaderData_AC(guaranteeClaim);
    ndcRequestData = mapNdcOfferCreateRequestData_AC(
      airCanadaConfig,
      offer,
      requestBody,
      guaranteeClaim,
      requestDocumentId,
    );
    providerUrl = `${airCanadaConfig.baseUrlPci}/OrderCreate`;
    apiKey = airCanadaConfig.apiKey;
    ndcBody = orderCreateRequestTemplate_AC(ndcRequestHeaderData, ndcRequestData);

    responseTransformTemplate = provideOrderCreateTransformTemplate_AC;
    errorsTransformTemplate = CreateOfferErrorsTransformTemplate_AC;
    faultsTransformTemplate = CreateOfferFaultsTransformTemplate_AC;
    const { response, error } = await ndcRequest(providerUrl, apiKey, ndcBody, SOAPAction);
    if (error && !error.isAxiosError) {

      throw new GliderError(
        error.message,
        502,
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
      ...errorsResult.errors,
    ];

    // If an error is found, stop here
    if (combinedErrors.length) {
      throw new GliderError(
        combinedErrors.map(e => e.message).join('; '),
        502,
      );
    } else if (error) {
      throw new GliderError(
        error.message,
        502,
      );
    }
    // Otherwise parse as a result
    const createResults = await transform(response.data, responseTransformTemplate);
    return createResults;
  }


  getProviderID () {
    return 'AC';
  }

  detectRequestType (itinerary) {
    // Checking of the type of request: OneWay or Return
    let requestDocumentId = 'OneWay';
    const { segments } = itinerary;

    if (
      segments.length === 2 &&
      (
        segments[0].origin.iataCode === segments[1].destination.iataCode ||
        segments[1].origin.iataCode === segments[0].destination.iataCode
      )
    ) {
      requestDocumentId = 'Return';
    }
    return requestDocumentId;
  }

};


// Convert response data to the object form
const processOfferPriceResponse = async (data, template) => {
  const offerResult = await transform(
    data,
    template,
  );

  offerResult.offer.expiration = new Date(Date.now() + 60 * 30 * 1000).toISOString();// now + 30 min

  offerResult.offer.priceClassList = reduceToObjectByKey(
    offerResult.offer.priceClassList.map(item => ({
      ...item,
      ...({
        description: item.description.join('\n'),
      }),
    })),
  );

  offerResult.offer.pricedItems.map(item => {
    item.fareBase.components = item.fareBase.components.map(c => ({
      ...c,
      ...({
        conditions: offerResult.offer.priceClassList[c.conditions].description,
      }),
    }));

    item.fare = [
      item.fareBase,
      ...item.fareSurcharge,
    ];

    delete item.fareBase;
    delete item.fareSurcharge;

    return item;
  });

  offerResult.offer.disclosures = offerResult.offer.disclosures.map(
    d => d.text.join('\n'),
  );

  offerResult.offer.terms = offerResult.offer.terms.join('\n');

  offerResult.offer.itinerary.segments = mergeHourAndDate(
    offerResult.offer.itinerary.segments,
  );

  offerResult.offer.itinerary.segments = offerResult.offer.itinerary.segments
    .map(s => {
      const operator = s.operator;
      operator.iataCode = operator.iataCode ? operator.iataCode : operator.iataCodeM;
      operator.flightNumber =
        `${operator.iataCodeM}${String(operator.flightNumber).padStart(4, '0')}`;
      delete operator.iataCodeM;
      delete s.Departure;
      delete s.Arrival;
      delete s.MarketingCarrier;
      delete s.OperatingCarrier;
      delete s.Equipment;
      delete s.ClassOfService;
      delete s.FlightDetail;
      return s;
    });

  offerResult.offer.itinerary.segments = reduceToObjectByKey(
    offerResult.offer.itinerary.segments,
  );
  offerResult.offer.services = reduceToObjectByKey(
    offerResult.offer.services,
  );

  offerResult.offer.options = dedupPassengersInOptions(
    offerResult.offer.options.map(
      ({ serviceId, ...offer }) => ({
        ...offer,
        code: offerResult.offer.services[serviceId].code,
        name: offerResult.offer.services[serviceId].name,
        description: offerResult.offer.services[serviceId].description,
        segment: offerResult.offer.services[serviceId].segment,
        passenger: offer.passenger.trim(),
      }),
    ),
  );

  delete offerResult.offer.services;

  // offerResult.offer.price.commission =
  //   offerResult.offer.price.commission.reduce(
  //     (total, { value }) => total + parseFloat(value),
  //     0
  //   ).toFixed(2);

  offerResult.offer.price.taxes =
    offerResult.offer.price.taxes.reduce(
      (total, { value }) => total + parseFloat(value),
      0,
    ).toFixed(2);

  offerResult.offer.passengers = reduceToObjectByKey(
    offerResult.offer.passengers,
  );

  delete offerResult.offer.priceClassList;

  return offerResult;
};
