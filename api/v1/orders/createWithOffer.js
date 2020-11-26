const GliderError = require('../../../helpers/error');
const { basicDecorator } = require('../../../decorators/basic');
const {
  offerManager,
  AccommodationOffer,
  FlightOffer,
} = require('../../../helpers/models/offer');
const { ordersManager } = require('../../../helpers/models/order');
const {
  getGuarantee,
  claimGuarantee,
  createVirtualCard,
  deleteGuarantee,
  deleteVirtualCard,
} = require('../../../helpers/guarantee');
const hotelResolver = require('../../../helpers/resolvers/hotel/orderCreateWithOffer');
const flightResolver = require('../../../helpers/resolvers/flight/orderCreateWithOffer');
const { setOrderStatus, assertOrderStatus } = require('../../../helpers/resolvers/utils/offers');
const { validateCreateOfferPayload } = require('../../../helpers/payload/validators');
module.exports = basicDecorator(async (req, res) => {
  const requestBody = req.body;

  if (!requestBody.offerId) {
    throw new GliderError(
      'Missing mandatory field: offerId',
      400,
    );
  }
  validateCreateOfferPayload(requestBody);

  // Retrieve the offer
  const storedOffer = await offerManager.getOffer(requestBody.offerId);

  let originOffers = [];

  // in case of not priced offer
  // there possible situation when storedOffer.extraData.originOffers is undefined
  if (storedOffer instanceof FlightOffer &&
    storedOffer.extraData &&
    storedOffer.extraData.originOffers) {

    originOffers = await Promise.all(
      storedOffer.extraData.originOffers.map(
        offerId => offerManager.getOffer(offerId),
      ),
    );
  }

  const allOffers = [
    storedOffer,
    ...originOffers,
  ];

  assertOrderStatus(allOffers);
  let virtualCard;
  let orderCreationResults;
  let guarantee;
  let guaranteeClaim;

  try {
    await setOrderStatus(allOffers, 'CREATING');


    if (requestBody.guaranteeId) {
      // Get the guarantee
      guarantee = await getGuarantee(requestBody.guaranteeId, storedOffer);
      console.log('Guarantee:', guarantee);
      //create virtual card
      let currency = storedOffer.currency;
      let amount = storedOffer.amountAfterTax;
      virtualCard = await createVirtualCard(amount, currency);
      console.log('Virtual card:',virtualCard);
    }

    // Handle an Accommodation offer
    if (storedOffer instanceof AccommodationOffer) {


      if (!virtualCard) {
        throw new GliderError('Card is required to complete the booking', 400);
      }

      // Resolve this query for an hotel offer
      orderCreationResults = await hotelResolver(
        storedOffer,
        requestBody.passengers,
        virtualCard,
      );
    }

    // Handle a flight offer
    else if (storedOffer instanceof FlightOffer) {
      let claim={
        card:virtualCard
      };
      orderCreationResults = await flightResolver(
        storedOffer,
        requestBody,
        claim,
      );
    }

    // Handle other types of offer
    else {
      throw new GliderError(
        'Unable to understand the offer type',
        500,
      );
    }

    if (guarantee) {
      //at this stage bookings should be created - we can commit payment transactions (claim guarantee)
      guaranteeClaim = await claimGuarantee(requestBody.guaranteeId);
    }

  } catch (error) {
    console.error(`Error while processing order:${error}`);
    //if booking failed, rollback transaction (cancel virtual card, delete guarantee)
    await deleteGuarantee(requestBody.guaranteeId);
    if(virtualCard) {
      await deleteVirtualCard(virtualCard.id);
    }
    await setOrderStatus(allOffers, 'UNLOCKED');
    throw error;
  }
  try {
    const createPaxIndex = (pax) => {
      return `${pax.type}${pax.lastnames.join('').toUpperCase()}${pax.firstnames.join('').toUpperCase()}${pax.birthdate.split('T')[0]}`.replace(/ /ig, '');
    };
    // Change passengers Ids to internal
    const passengersIndex = Object.entries(requestBody.passengers)
      .reduce(
        (a, v) => {
          let index = createPaxIndex(v[1]);
          a[index] = v[0];
          return a;
        },
        {},
      );

    if (storedOffer instanceof AccommodationOffer) {
      /*
            delete orderCreationResults.order.success;
            delete orderCreationResults.order.errors;
      */
    } else if (storedOffer instanceof FlightOffer) {
      const changedPassengers =
        Object.entries(orderCreationResults.order.passengers)
          .reduce(
            (a, v) => {
              const index = createPaxIndex(v[1]);
              if (passengersIndex[index]) {
                a.passengers[passengersIndex[index]] = v[1];
                a.mapping[v[0]] = passengersIndex[index];
              }
              return a;
            },
            {
              passengers: {},
              mapping: {},
            },
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
            },
          );
      }

      // // Change segments Ids to internal values
      // const segmentsIndex = storedOffer.extraData.segments
      //   .reduce(
      //     (a, v) => {
      //       a[`${v.index}`] = v.id;
      //       return a;
      //     },
      //     {}
      //   );
      let segments = [];
      Object.keys(orderCreationResults.order.itinerary.segments).forEach(segmentId => {
        segments.push(orderCreationResults.order.itinerary.segments[segmentId]);
      });

      orderCreationResults.order.itinerary.segments = segments;

      /* orderCreationResults.order.itinerary.segments =
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
           );*/
    }

    await ordersManager.saveOrder(
      orderCreationResults.orderId,
      {
        provider: storedOffer.provider,
        request: requestBody,
        guarantee: guarantee,
        guaranteeClaim: guaranteeClaim,
        order: orderCreationResults,
        offer: storedOffer,
      },
      'CREATED',
    );

    await setOrderStatus(allOffers, 'CREATED');

    res.status(200).json(orderCreationResults);
  } catch (error) {
    await setOrderStatus(allOffers, 'UNLOCKED');
    throw error;
  }
});
