
const GliderError = require('../../error');
const {
  mergeHourAndDate,
  reduceToObjectByKey,
  useDictionary,
  reduceContactInformation,
  splitPropertyBySpace,
  reduceToProperty,
} = require('../../parsers');

const { offerPriceRQ } = require('./offerPrice');

const { createFlightProvider } = require('../../providers/providerFactory');

module.exports = async (offer, requestBody, guaranteeClaim) => {
  if (!offer.isPriced) {
    const offerPriceResult = await offerPriceRQ(
      requestBody.offerId,
      requestBody,
      false,
    );

    if (offerPriceResult.offer.price.public !== offer.amountAfterTax) {
      throw new GliderError(
        'Offer price has changed, reprice is required',
        502,
      );
    }
  }

  const provider = offer.provider;
  const providerImpl = createFlightProvider(provider);
  let createResults = await providerImpl.orderCreate(offer, requestBody, guaranteeClaim);

  // Otherwise parse as a result
  if(provider!== 'AMADEUS') {//FIXME remove reference to Amadeus
    createResults.order.itinerary.segments = mergeHourAndDate(createResults.order.itinerary.segments);
  }
  createResults.order.itinerary.segments = createResults.order.itinerary.segments
    .map(s => {
      const operator = s.operator;
      operator.iataCode = operator.iataCode ? operator.iataCode : operator.iataCodeM;
      operator.flightNumber =
        `${operator.iataCodeM}${String(operator.flightNumber).padStart(4, '0')}`;
      delete operator.iataCodeM;
      return s;
    });
  createResults.order.itinerary.segments = reduceToObjectByKey(createResults.order.itinerary.segments);
  if (typeof createResults.order.price.commission === 'object') {
    createResults.order.price.commission = createResults.order.price.commission.reduce(
      (total, { value }) => total + parseFloat(value),
      0,
    ).toString();
  }
  if (typeof createResults.order.price.commission === 'object') {
    createResults.order.price.taxes =
      createResults.order.price.taxes.reduce(
        (total, { value }) => total + parseFloat(value),
        0,
      ).toString();
  }
  createResults.order.contactList = reduceToObjectByKey(createResults.order.contactList);
  createResults.order.passengers = useDictionary(createResults.order.passengers, createResults.order.contactList, 'contactInformation');
  createResults.order.passengers = splitPropertyBySpace(createResults.order.passengers, 'firstnames');
  createResults.order.passengers = splitPropertyBySpace(createResults.order.passengers, 'lastnames');
  createResults.order.passengers = reduceContactInformation(createResults.order.passengers);
  createResults.order.passengers = reduceToObjectByKey(createResults.order.passengers);
  if (/*guaranteeClaim &&*/   //why at this stage do we check this? Booking should fail if there is no claim
    createResults.travelDocuments &&
    Array.isArray(createResults.travelDocuments.bookings) &&
    createResults.travelDocuments.bookings.length > 0) {
    createResults.travelDocuments.etickets = reduceToObjectByKey(
      createResults.travelDocuments.etickets,
    );
    createResults.travelDocuments.etickets = reduceToProperty(
      createResults.travelDocuments.etickets,
      '_passenger_',
    );
  } else {
    delete createResults.travelDocuments;
  }

  delete createResults.order.contactList;

  createResults.order.options = offer.extraData.options;
  return createResults;
};
