const { airCanadaConfig } = require('../../../../config');
const { transform } = require('camaro');
//TODO move utils to a separate package
const { flatOneDepth } = require('../../../transformInputData/utils/collections');
const { dedupPassengersInOptions } = require('../../../resolvers/utils/flightUtils');
const {
  mergeHourAndDate, reduceToObjectByKey,
} = require('../../../parsers');

// shopping templates
const { mapNdcRequestData_AC: mapNdcShoppingRequestData_AC } = require('./transformInputData/searchOffers');
const { provideShoppingRequestTemplate_AC } = require('./soapTemplates/searchOffers');
const { provideAirShoppingTransformTemplate_AC } = require('./camaroTemplates/shoppingTemplate');

// pricing templates
const { mapNdcRequestData_AC: mapNdcOfferPriceRequestData_AC } = require('./transformInputData/offerPrice');
const { offerPriceRequestTemplate_AC } = require('./soapTemplates/offerPrice');
const { provideOfferPriceTransformTemplate_AC } = require('./camaroTemplates/provideOfferPrice');

//order create templates
const { mapNdcRequestHeaderData_AC: mapNdcOfferCreateRequestHeaderData_AC, mapNdcRequestData_AC: mapNdcOfferCreateRequestData_AC } = require('./transformInputData/createOrder');
const { orderCreateRequestTemplate_AC } = require('./soapTemplates/createOrder');
const { provideOrderCreateTransformTemplate_AC } = require('./camaroTemplates/provideOrderCreate');

//seatmap templates
const { mapNdcRequestData_AC: mapNdcSeatmapRequestData_AC } = require('./transformInputData/seatAvailability');
const { seatAvailabilityRequestTemplate_AC } = require('./soapTemplates/seatAvailability');
const { provideSeatAvailabilityTransformTemplate_AC } = require('./camaroTemplates/provideSeatAvailability');

//fulfillment templates
const {
  mapNdcRequestHeaderData_AC: mapNdcFulfillRequestHeaderData_AC,
  mapNdcRequestData_AC: mapNdcFulfillRequestData_AC,
} = require('./transformInputData/fulfillOrder');
const { fulfillOrderTemplate_AC } = require('./soapTemplates/fulfillOrder');
const { fulfillOrderTransformTemplate_AC } = require('./camaroTemplates/fulfillOrder');


// flight search
const createFlightSearchRequest = (itinerary, passengers) => {
  let requestDocumentId = detectItineraryType(itinerary);
  let ndcRequestData = mapNdcShoppingRequestData_AC(airCanadaConfig, itinerary, passengers, requestDocumentId);
  return provideShoppingRequestTemplate_AC(ndcRequestData);
};

const processFlightSearchResponse = async (data) => {
  let searchResults =  await transform(data, provideAirShoppingTransformTemplate_AC);
  searchResults.itineraries.segments = mergeHourAndDate(searchResults.itineraries.segments);
  return searchResults;
};


//retrieve seatmap
const createRetrieveSeatmapRequest = (offers) => {
  // Check the type of request: OneWay or Return
  let requestDocumentId = detectOffersType(offers);
  let ndcRequestData = mapNdcSeatmapRequestData_AC(airCanadaConfig, offers, requestDocumentId);
  return seatAvailabilityRequestTemplate_AC(ndcRequestData);
};


// Convert response data to the object form
const processSeatmapResponse = async (data, offers) => {
  // Index segments from offers
  const indexedSegments = flatOneDepth(
    offers.map(offer => offer.extraData.segments.map(s => ({
      [`${s.Departure.AirportCode}-${s.Arrival.AirportCode}`]: s.id,
    }))),
  ).reduce((a, v) => ({ ...a, ...v }), {});
  const seatMapResult = await transform(data, provideSeatAvailabilityTransformTemplate_AC);

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

//offer price
const createPriceOffersRequest = (offers, body) => {
  // Check the type of request: OneWay or Return
  let requestDocumentId = detectOffersType(offers);
  let ndcRequestData = mapNdcOfferPriceRequestData_AC(airCanadaConfig, offers, body, requestDocumentId);
  return offerPriceRequestTemplate_AC(ndcRequestData);
};


// Convert response data to the object form
const processOfferPriceResponse = async (data) => {
  const offerResult = await transform(data, provideOfferPriceTransformTemplate_AC);

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



//create order
const createOrderCreateRequest = (offer, requestBody, guaranteeClaim) => {
  // Check the type of request: OneWay or Return
  let requestDocumentId = 'OneWay';
  if (offer.isReturnTrip) {
    requestDocumentId = 'Return';
  }
  let ndcRequestHeaderData = mapNdcOfferCreateRequestHeaderData_AC(guaranteeClaim);
  let ndcRequestData = mapNdcOfferCreateRequestData_AC(airCanadaConfig, offer, requestBody, guaranteeClaim, requestDocumentId);
  return orderCreateRequestTemplate_AC(ndcRequestHeaderData, ndcRequestData);
};

const processOrderCreateResponse = async (data) => {
  return await transform(data, provideOrderCreateTransformTemplate_AC);
};

//order fulfillment
const createFulfillOrderRequest = (orderId, order, body, guaranteeClaim) => {
  let ndcRequestHeaderData = mapNdcFulfillRequestHeaderData_AC(guaranteeClaim);
  let ndcRequestData = mapNdcFulfillRequestData_AC(airCanadaConfig, order, body, guaranteeClaim);
  return fulfillOrderTemplate_AC(ndcRequestHeaderData, ndcRequestData);
};

const processOrderFulfillmentResponse = async (data) => {
  return await transform(data, fulfillOrderTransformTemplate_AC);
};

const detectItineraryType = (itinerary) => {
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
};
const detectOffersType = (offers) => {
  // Check the type of request: OneWay or Return
  let requestDocumentId = 'OneWay';
  if (offers.length > 1) {
    requestDocumentId = 'Return';
  }
  return requestDocumentId;
};

module.exports = {
  createFlightSearchRequest,
  createPriceOffersRequest,
  createRetrieveSeatmapRequest,
  createFulfillOrderRequest,
  createOrderCreateRequest,
  processFlightSearchResponse,
  processOfferPriceResponse,
  processSeatmapResponse,
  processOrderCreateResponse,
  processOrderFulfillmentResponse,
};
