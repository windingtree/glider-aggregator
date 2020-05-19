const { ready, transform } = require('camaro');
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
  callProvider,
  fetchFlightsOffersByIds,
  dedupPassengersInOptions
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
const processResponse = async (data, template, requestedOptions) => {
  await ready();  
  const offerResult = await transform(
    data,
    template
  );

  offerResult.offer.expiration = new Date(Date.now() + 60 * 30 * 1000).toISOString();// now + 30 min

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

  offerResult.offer.disclosures = offerResult.offer.disclosures.map(
    d => d.text.join('\n')
  );

  offerResult.offer.terms = offerResult.offer.terms.join('\n');
  
  offerResult.offer.itinerary.segments = mergeHourAndDate(
    offerResult.offer.itinerary.segments
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
    offerResult.offer.itinerary.segments
  );
  offerResult.offer.services = reduceToObjectByKey(
    offerResult.offer.services
  );

  offerResult.offer.options = dedupPassengersInOptions(
    offerResult.offer.options.map(
      ({ serviceId, ...offer }) => ({
        ...offer,
        code: offerResult.offer.services[serviceId].code,
        name: offerResult.offer.services[serviceId].name,
        description: offerResult.offer.services[serviceId].description,
        segment: offerResult.offer.services[serviceId].segment,
        passenger: offer.passenger.trim()
      })
    )
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
      0
    ).toFixed(2);
  
  offerResult.offer.passengers = reduceToObjectByKey(
    offerResult.offer.passengers
  );

  delete offerResult.offer.priceClassList;

  return offerResult;
};

// Create a OfferPrice request
module.exports.offerPriceRQ = async (
  offerIds,
  body,
  offerUpdateRequired = true
) => {

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
      ndcRequestData = mapNdcRequestData_AC(
        airCanadaConfig,
        offers,
        body,
        requestDocumentId
      );
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

  const mergedOldOffers = offers.reduce(
    (a, v) => {
      a.segments = [
        ...a.segments,
        ...v.extraData.segments.map(s => ({
          ...s,
          index: `${s.origin.iataCode}${s.destination.iataCode}`
        }))
      ];
      a.passengers = {
        ...a.passengers,
        ...v.extraData.passengers
      };
      a.mappedPassengers = {
        ...a.mappedPassengers,
        ...v.extraData.mappedPassengers
      };
      return a;
    },
    {
      segments: [],
      passengers: {},
      mappedPassengers: {}
    }
  ); 

  // Update serments Ids to initially obtained with original offers
  const newSegmentsChanged = Object.entries(offerResult.offer.itinerary.segments)
    .reduce(
      (a, v) => {
        const index = `${v[1].origin.iataCode}${v[1].destination.iataCode}`;
        mergedOldOffers.segments.forEach(s => {
          if (s.index === index) {
            a.segments[s.id] = v[1];
            a.mapping[v[0]] = s.id;
          }
        });
        return a;
      },
      {
        segments: {},
        mapping: {}
      }
    );

  offerResult.offer.itinerary.segments = newSegmentsChanged.segments;
  
  // Update serments refs to initially obtained with original offers
  const newDestinationsChanged = offerResult.offer.destinations
    .map(d => ({
      ...d,
      FlightReferences: d.FlightReferences
        .split(' ')
        .map(f => newSegmentsChanged.mapping[f])
        .join(' ')
    }));
  delete offerResult.offer.destinations;

  // Update passengers Ids to initally assigned during offers search
  const newPassengersChanged = Object.entries(offerResult.offer.passengers)
    .reduce(
      (a, v) => {
        const scope = mergedOldOffers.passengers[v[1].type];
        if (!a.mapping[v[0]]) {
          const passengers = scope.filter(p => !a.mapped.includes(p));

          if (passengers.length > 0) {
            a.mapping[v[0]] = passengers[0];
            a.mapped.push(passengers[0]);
            a.passengers[passengers[0]] = v[1];
          }
        }
        return a;
      },
      {
        passengers: {},
        mapped: [],
        mapping: {}
      }
    );

  offerResult.offer.passengers = newPassengersChanged.passengers;

  // Change new segments Ids in options part
  const requestedPassengers = body.map(o => o.passenger);
  offerResult.offer.options = offerResult.offer.options
    .map(
      o => ({
        ...o,
        passenger: o.passenger
          .trim()
          .split(' ')
          .map(p => newPassengersChanged.mapping[p])
          .join(' '),
        segment: newSegmentsChanged.mapping[o.segment]
      })
    )
    .reduce(
      (a, v) => {
        if (requestedPassengers.includes(v.passenger)) {
          a.push(v);
        }
        return a;
      },
      []
    );

  // Create indexed version of the priced offer
  offerResult.offerId = offers.length === 1 ? offerIds[0] : uuidv4();
  const offer = new FlightOffer(
    offers[0].provider,
    offers[0].provider,
    offerResult.offer.expiration,
    reduceToObjectByKey(
      offerResult.offer.pricedItems.map(o => {
        const offerItem = JSON.parse(JSON.stringify(o));
        offerItem.passengerReferences = offerItem.passengerReferences
          .map(
            p => p
              .split(' ')
              .map(p => newPassengersChanged.mapping[p])
          )
          .reduce(
            (a, v) => {
              v.forEach(p => {
                if (!a.includes(p)) {
                  a.push(p);
                }
              });
              return a;
            },
            []
          )
          .join(' ');
          
        delete o.passengerReferences;
        delete offerItem.taxes;
        delete offerItem.fare;
        return offerItem;
      })
    ),
    offerResult.offer.price.public,
    offerResult.offer.price.currency,
    {
      segments: mergedOldOffers.segments,
      destinations: newDestinationsChanged,
      mappedPassengers: mergedOldOffers.mappedPassengers,
      passengers: mergedOldOffers.passengers,
      options: offerResult.offer.options,
      seats: body
    }
  );
  
  offer.offerId = offerResult.offerId;
  offer.isPriced = true;
  offer.isReturnTrip = requestDocumentId === 'Return';

  if (offers.length > 1 || offerUpdateRequired) {
    // Save new priced offer
    await offerManager.saveOffer(offerResult.offerId, {
      offer
    });
  }

  offerResult.offer.pricedItems = offerResult.offer.pricedItems.map(item => {
    delete item._id_;
    return item;
  });

  return offerResult;
};
