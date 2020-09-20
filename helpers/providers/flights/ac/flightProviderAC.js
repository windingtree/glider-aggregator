const FlightProviderNDCCommon = require('../ndc/flightProviderNDCCommon');
const { flightSearchRQ, offerPriceRQ, createOrderRQ, fulfillOrderRQ, retrieveSeatMapRQ } = require('./ndcClientAC');
const { airCanadaConfig } = require('../../../../config');
const { transform } = require('camaro');
const GliderError = require('../../../error');
//TODO move utils to a separate package
const { flatOneDepth } = require('../../../transformInputData/utils/collections');
const { dedupPassengersInOptions } = require('../../../resolvers/utils/flightUtils');
const {
  mergeHourAndDate, reduceToObjectByKey,
} = require('../../../parsers');

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

//seatmap templates
const { mapNdcRequestData_AC: mapNdcSeatmapRequestData_AC } = require('./transformInputData/seatAvailability');
const { seatAvailabilityRequestTemplate_AC } = require('./soapTemplates/seatAvailability');
const {
  provideSeatAvailabilityTransformTemplate_AC,
  FaultsTransformTemplate_AC: SeatMapFaultsTransformTemplate_AC,
  ErrorsTransformTemplate_AC: SeatMapErrorsTransformTemplate_AC,
} = require('./camaroTemplates/provideSeatAvailability');

//fulfillment templates
const {
  mapNdcRequestHeaderData_AC: mapNdcFulfillRequestHeaderData_AC,
  mapNdcRequestData_AC: mapNdcFulfillRequestData_AC,
} = require('./transformInputData/fulfillOrder');
const { fulfillOrderTemplate_AC } = require('./soapTemplates/fulfillOrder');
const {
  ErrorsTransformTemplate_AC: FulfillErrorsTransformTemplate_AC,
  FaultsTransformTemplate_AC: FulfillFaultsTransformTemplate_AC,
  fulfillOrderTransformTemplate_AC,
} = require('./camaroTemplates/fulfillOrder');


const assertErrors = require('../../../resolvers/utils/assertResponseErrors');
module.exports = class FlightProviderAC extends FlightProviderNDCCommon {
  constructor () {
    super();
  }

  async flightSearch (itinerary, passengers) {
    let ndcRequestData;
    let ndcBody;
    let body = { itinerary: itinerary, passengers: passengers };
    let requestDocumentId = this.detectRequestType(itinerary);
    ndcRequestData = mapNdcShoppingRequestData_AC(airCanadaConfig, body, requestDocumentId);
    ndcBody = provideShoppingRequestTemplate_AC(ndcRequestData);
    let { response } = await flightSearchRQ(ndcBody);
    //TODO unify response error processing
    let faultsResult = await transform(response.data, ShoppingFaultsTransformTemplate_AC);
    let errorsResult = await transform(response.data, ShoppingErrorsTransformTemplate_AC);
    const combinedErrors = [
      ...(faultsResult ? faultsResult.errors : []),
      ...(errorsResult ? errorsResult.errors : []),
    ];

    let searchResults = await transform(response.data, provideAirShoppingTransformTemplate_AC);
    return { provider: this.getProviderID(), response: searchResults, errors: combinedErrors };
  }

  async retrieveSeatmaps (offers) {
    let ndcRequestData;
    let ndcBody;
    // Check the type of request: OneWay or Return
    let requestDocumentId = 'OneWay';
    if (offers.length > 1) {
      requestDocumentId = 'Return';
    }
    ndcRequestData = mapNdcSeatmapRequestData_AC(airCanadaConfig, offers, requestDocumentId);
    ndcBody = seatAvailabilityRequestTemplate_AC(ndcRequestData);
    const { response, error } = await retrieveSeatMapRQ(ndcBody);
    await assertErrors(error, response, SeatMapFaultsTransformTemplate_AC, SeatMapErrorsTransformTemplate_AC);
    return await processSeatmapResponse(response.data, offers, provideSeatAvailabilityTransformTemplate_AC);
  }

  async priceOffers (body, offers) {
    // providerImpl.priceOffers
    let ndcRequestData;
    let ndcBody;
    // Check the type of request: OneWay or Return
    let requestDocumentId = (offers.length === 0) ? 'OneWay' : 'Return';
    ndcRequestData = mapNdcOfferPriceRequestData_AC(airCanadaConfig, offers, body, requestDocumentId);
    ndcBody = offerPriceRequestTemplate_AC(ndcRequestData);
    const { response, error } = await offerPriceRQ(ndcBody);
    await assertErrors(error, response, OfferPriceFaultsTransformTemplate_AC, OfferPriceErrorsTransformTemplate_AC);
    return await processOfferPriceResponse(response.data, provideOfferPriceTransformTemplate_AC);
  };

  async orderCreate (offer, requestBody, guaranteeClaim) {

    let ndcRequestHeaderData;
    let ndcRequestData;
    let ndcBody;

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
    ndcBody = orderCreateRequestTemplate_AC(ndcRequestHeaderData, ndcRequestData);
    const { response, error } = await createOrderRQ(ndcBody);
    if (error && !error.isAxiosError) {
      throw new GliderError(
        error.message,
        502,
      );
    }
    let faultsResult = await transform(response.data, CreateOfferFaultsTransformTemplate_AC);
    // Attempt to parse as a an error
    const errorsResult = await transform(response.data, CreateOfferErrorsTransformTemplate_AC);

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
    return await transform(response.data, provideOrderCreateTransformTemplate_AC);
  }

  async orderFulfill (orderId, order, body, guaranteeClaim){
    let ndcRequestHeaderData;
    let ndcRequestData;
    let ndcBody;
    // guaranteeClaim = await claimGuaranteeWithCard(body.guaranteeId);
    ndcRequestHeaderData = mapNdcFulfillRequestHeaderData_AC(guaranteeClaim);
    ndcRequestData = mapNdcFulfillRequestData_AC(airCanadaConfig, order, body, guaranteeClaim);
    ndcBody = fulfillOrderTemplate_AC(ndcRequestHeaderData, ndcRequestData);
    const { response, error } = await fulfillOrderRQ(ndcBody);

    if (error && !error.isAxiosError) {
      throw new GliderError(response.error.message, 502);
    }

    let faultsResult  = await transform(response.data, FulfillFaultsTransformTemplate_AC);
    // Attempt to parse as a an error
    // await ready();
    const errorsResult = await transform(response.data, FulfillErrorsTransformTemplate_AC);

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
    // await ready();
    return await transform(response.data, fulfillOrderTransformTemplate_AC);

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


// Convert response data to the object form
const processSeatmapResponse = async (data, offers, template) => {
  // Index segments from offers
  const indexedSegments = flatOneDepth(
    offers.map(offer => offer.extraData.segments.map(s => ({
      [`${s.Departure.AirportCode}-${s.Arrival.AirportCode}`]: s.id,
    }))),
  ).reduce((a, v) => ({ ...a, ...v }), {});
  const seatMapResult = await transform(
    data,
    template,
  );

  seatMapResult.services = reduceToObjectByKey(seatMapResult.services);

  seatMapResult.offers = seatMapResult.offers.map(o => {
    o.offerItems = reduceToObjectByKey(
      o.offerItems,
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
            number: `${r.number}${s.number}`,
          }),
          ...({
            optionCode: seatMapResult.offers.reduce((acc, val) => {
              if (val.offerItems[s.optionCode]) {
                const serviceRef = val.offerItems[s.optionCode].serviceRef;
                acc = `${serviceRef}.${seatMapResult.services[serviceRef].name}`;
                prices[acc] = {
                  currency: val.offerItems[s.optionCode].currency,
                  public: val.offerItems[s.optionCode].public,
                  taxes: val.offerItems[s.optionCode].taxes,
                };
              }
              return acc;
            }, undefined),
          }),
        }))),
      );
      delete c.rows;
      return c;
    });

    if (indexedSegments[v.segmentKey]) {
      a[indexedSegments[v.segmentKey]] = {
        cabins: v.cabins,
        prices,
      };
    }

    return a;
  }, {});
  return seatMapResult.seatMaps;
};
