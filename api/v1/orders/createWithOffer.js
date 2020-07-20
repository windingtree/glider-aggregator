const GliderError = require('../../../helpers/error');
const { basicDecorator } = require('../../../decorators/basic');
const {
  offerManager,
  AccommodationOffer,
  FlightOffer
} = require('../../../helpers/models/offer');
const { ordersManager } = require('../../../helpers/models/order');
const {
  getGuarantee,
  claimGuaranteeWithCard
} = require('../../../helpers/guarantee');
const hotelResolver = require('../../../helpers/resolvers/hotel/orderCreateWithOffer');
const flightResolver = require('../../../helpers/resolvers/flight/orderCreateWithOffer');
const { setOrderStatus, assertOrderStatus } = require('../../../helpers/resolvers/utils/offers');

module.exports = basicDecorator(async (req, res) => {
  const requestBody = req.body;

  if (!requestBody.offerId) {
    throw new GliderError(
      'Missing mandatory field: offerId',
      400
    );
  }

  // Retrieve the offer
  const storedOffer = await offerManager.getOffer(requestBody.offerId);

  let originOffers = [];

  if (storedOffer instanceof FlightOffer) {
    originOffers = await Promise.all(
      storedOffer.extraData.originOffers.map(
        offerId => offerManager.getOffer(offerId)
      )
    );
  }
  
  const allOffers = [
    storedOffer,
    ...originOffers
  ];

  assertOrderStatus(allOffers);

  try {
    await setOrderStatus(allOffers, 'CREATING');

    let orderCreationResults;
    let guarantee;
    let guaranteeClaim;

    if (requestBody.guaranteeId) {
      // Get the guarantee
      guarantee = await getGuarantee(requestBody.guaranteeId, storedOffer);
    
      // Claim the guarantee
      guaranteeClaim = await claimGuaranteeWithCard(requestBody.guaranteeId);
    }

    // Handle an Accommodation offer
    if (storedOffer instanceof AccommodationOffer) {

      if (!guaranteeClaim) {
        throw new GliderError(
          'Claimed guarantee is required',
          400
        );
      }

      // Resolve this query for an hotel offer
      orderCreationResults = await hotelResolver(
        storedOffer,
        requestBody.passengers,
        guaranteeClaim.card
      );
    }

    // Handle a flight offer
    else if (storedOffer instanceof FlightOffer) {
      orderCreationResults = await flightResolver(
        storedOffer,
        requestBody,
        guaranteeClaim
      );
    }

    // Handle other types of offer
    else {
      throw new GliderError(
        'Unable to understand the offer type',
        500
      );
    }

    // Change passengers Ids to indernal
    const passengersIndex = Object.entries(requestBody.passengers)
      .reduce(
        (a, v) => {
          a[`${v[1].type}${v[1].lastnames.join('').toUpperCase()}${v[1].firstnames.join('').toUpperCase()}${v[1].birthdate.split('T')[0]}`] = v[0];
          return a;
        },
        {}
      );

    if (storedOffer instanceof AccommodationOffer) {
      delete orderCreationResults.order.success;
      delete orderCreationResults.order.errors;
    } else if (storedOffer instanceof FlightOffer) {
      const changedPassengers =
        Object.entries(orderCreationResults.order.passengers)
          .reduce(
            (a, v) => {
              const index = `${v[1].type}${v[1].lastnames.join('').toUpperCase()}${v[1].firstnames.join('').toUpperCase()}${v[1].birthdate}`;
              if (passengersIndex[index]) {
                a.passengers[passengersIndex[index]] = v[1];
                a.mapping[v[0]] = passengersIndex[index];
              }
              return a;
            },
            {
              passengers: {},
              mapping: {}
            }
          );
      orderCreationResults.order.passengers = changedPassengers.passengers;
      
      // Change passengers Ids in travelDocuments to internal values
      if (orderCreationResults.travelDocuments) {
        orderCreationResults.travelDocuments.etickets =
          orderCreationResults.travelDocuments.etickets.map(
            tickets => {
              const changedTickets = {};
              for (const t in tickets) {
                changedTickets[t] = changedPassengers.mapping[tickets[t]];
              }
              return changedTickets;
            }
          );
      }

      // Change segments Ids to internal values
      const segmentsIndex = storedOffer.extraData.segments
        .reduce(
          (a, v) => {
            a[`${v.index}`] = v.id;
            return a;
          },
          {}
        );

      orderCreationResults.order.itinerary.segments =
        Object.entries(orderCreationResults.order.itinerary.segments)
          .reduce(
            (a, v) => {
              const index = `${v[1].origin.iataCode}${v[1].destination.iataCode}`;
              if (segmentsIndex[index]) {
                a[segmentsIndex[index]] = v[1];
              }
              return a;
            },
            {}
          );
    }
    
    await ordersManager.saveOrder(
      orderCreationResults.orderId,
      {
        provider: storedOffer.provider,
        request: requestBody,
        guarantee: guarantee,
        guaranteeClaim: guaranteeClaim,
        order: orderCreationResults,
        offer: storedOffer
      }
    );

    await setOrderStatus(allOffers, 'CREATED');

    res.status(200).json(orderCreationResults);
  } catch (error) {
    await setOrderStatus(allOffers, 'UNLOCKED');
    throw error;
  }
});
