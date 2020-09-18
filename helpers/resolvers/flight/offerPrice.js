const { createFlightProvider } = require('../../providers/providerFactory');

const { v4: uuidv4 } = require('uuid');
const GliderError = require('../../error');

const {
  reduceToObjectByKey,
} = require('../../parsers');
const {
  offerManager,
  FlightOffer,
} = require('../../models/offer');
const {
  fetchFlightsOffersByIds,
} = require('../../resolvers/utils/flightUtils');

const { setOrderStatus, assertOrderStatus } = require('../utils/offers');


// Create a OfferPrice request
module.exports.offerPriceRQ = async (
  offerIds,
  body,
  offerUpdateRequired = true,
) => {

  if (!offerIds) {
    throw new GliderError(
      'Missing mandatory field: offerIds',
      400,
    );
  }

  // Convert incoming Ids into list
  offerIds = offerIds.split(',').map(o => o.trim());

  // Retrieve the offers
  const offers = await fetchFlightsOffersByIds(offerIds);
  // console.log('Offers fetched from DB',JSON.stringify(offers));
  // Assert order status in offers
  assertOrderStatus(offers);

  try {
    await setOrderStatus(offers, 'CREATING');


    let provider = offers[0].provider;
    let providerImpl = createFlightProvider(provider);
    let offerResult = await providerImpl.priceOffers(body, offers);

    let requestDocumentId = (offers.length === 0) ? 'OneWay' : 'Return';

    const mergedOldOffers = offers.reduce(
      (a, v) => {
        a.segments = [
          ...a.segments,
          ...v.extraData.segments.map(s => ({
            ...s,
            index: `${s.origin.iataCode}${s.destination.iataCode}`,
          })),
        ];
        a.passengers = {
          ...a.passengers,
          ...v.extraData.passengers,
        };
        a.mappedPassengers = {
          ...a.mappedPassengers,
          ...v.extraData.mappedPassengers,
        };
        a.rawOffer = {
          ...v.extraData.rawOffer,
        };
        return a;
      },
      {
        segments: [],
        passengers: {},
        mappedPassengers: {},
        rawOffer: {},
      },
    );

    // Update segments Ids to initially obtained with original offers
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
          mapping: {},
        },
      );

    offerResult.offer.itinerary.segments = newSegmentsChanged.segments;

    // Update segments refs to initially obtained with original offers
    const newDestinationsChanged = offerResult.offer.destinations
      .map(d => ({
        ...d,
        FlightReferences: d.FlightReferences
          .split(' ')
          .map(f => newSegmentsChanged.mapping[f])
          .join(' '),
      }));
    delete offerResult.offer.destinations;

    // Update passengers Ids to initially assigned during offers search
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
          mapping: {},
        },
      );

    offerResult.offer.passengers = newPassengersChanged.passengers;

    // Change new segments Ids in options part
    const requestedPassengers = Array.isArray(body) ? body.map(o => o.passenger) : [];
    offerResult.offer.options = offerResult.offer.options
      .map(
        o => ({
          ...o,
          passenger: o.passenger
            .trim()
            .split(' ')
            .map(p => newPassengersChanged.mapping[p])
            .join(' '),
          segment: newSegmentsChanged.mapping[o.segment],
        }),
      )
      .reduce(
        (a, v) => {
          if (requestedPassengers.includes(v.passenger)) {
            a.push(v);
          }
          return a;
        },
        [],
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
                .map(p => newPassengersChanged.mapping[p]),
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
              [],
            )
            .join(' ');

          delete o.passengerReferences;
          delete offerItem.taxes;
          delete offerItem.fare;
          return offerItem;
        }),
      ),
      offerResult.offer.price.public,
      offerResult.offer.price.currency,
      {
        segments: mergedOldOffers.segments,
        destinations: newDestinationsChanged,
        mappedPassengers: mergedOldOffers.mappedPassengers,
        passengers: mergedOldOffers.passengers,
        options: offerResult.offer.options,
        seats: body,
        rawOffer: mergedOldOffers.rawOffer,
      },
    );

    offer.offerId = offerResult.offerId;
    offer.isPriced = true;
    offer.isReturnTrip = requestDocumentId === 'Return';
    offer.extraData = {
      ...(
        offer.extraData
          ? offer.extraData
          : {}
      ),
      originOffers: offerIds, // enable tracing of merged offers to origin offers
    };

    if (offers.length > 1 || offerUpdateRequired) {
      // Save new priced offer
      await offerManager.saveOffer(offerResult.offerId, {
        offer,
      });
    }

    offerResult.offer.pricedItems = offerResult.offer.pricedItems.map(item => {
      delete item._id_;
      return item;
    });

    return offerResult;
  } catch (error) {
    await setOrderStatus(offers, 'UNLOCKED');
    throw error;
  }
};
