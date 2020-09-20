const { v4: uuidv4 } = require('uuid');
const { createSegment, createPrice, createPassenger } = require('./amadeusFormatUtils');
const taxDefinitions = require('../../../../../assets/taxDefinitions.json') || {};


const createPricedItem = (pricedItemId, passengerReferences, taxes, fares) => {
  return {
    _id_: pricedItemId,
    taxes: taxes,
    passengerReferences: passengerReferences,
    fare: fares,
  };
};

const createTaxItem = (taxCode, taxAmount, taxDescription) => {
  return {
    amount: taxAmount,
    code: taxCode,
    description: taxDescription,
  };
};

const createPricedOffer = (offerId, expiryDate, price) => {
  return {
    offerId: offerId,
    offer: {
      price: price,
      pricedItems: [],
      disclosures: [],
      terms: '',
      passengers: [],
      itinerary: {
        segments: {},
      },
      options: [],
      destinations: [],
      expiration: expiryDate,
    },
  };
};

const createFareItem = (usage, amount, description, fareItemComponents) => {
  return {
    usage: usage,
    amount: amount,
    description: description,
    components: fareItemComponents,
  };
};
const createFareItemComponent = (name, fareBasisCode, fareClass, conditions = ' ') => {
  return {
    name: name,
    basisCode: fareBasisCode,
    designator: fareClass,
    conditions: conditions,
  };
};

const createOfferPriceRequest = (offers) => {
  let request = {
    data: {
      type: 'flight-offers-pricing',
      flightOffers: [],
    },
  };
  request.data.flightOffers.push(...offers);
  return request;
};


const processPriceOfferResponse = (response) => {
  const { flightOffers } = response.data;
  let pricedOffers = [];

  //iterate over offers
  flightOffers.map(_flightOffer => {
    let { lastTicketingDate: _lastTicketingDate, itineraries: _itineraries, price: _price, travelerPricings: _travelerPricings } = _flightOffer;

    //TODO - add commission calculation
    let offerPrice = createPrice(_price);
    let currentOffer = createPricedOffer('offer-' + uuidv4(), _lastTicketingDate, offerPrice);
    pricedOffers.push(currentOffer);
    //collect all segments and itineraries of an offer
    _itineraries.map(_itinerary => {
      _itinerary.segments.map(_segment => {
        //build segment object
        let segment = createSegment(_segment);
        console.log('segment', segment);
        console.log('segment._id_', segment._id_);
        console.log('segment.id', segment.id);
        currentOffer.offer.itinerary.segments[segment._id_] = segment;
      });
    });

    //extract offer items (passengers)
    _travelerPricings.map(_travelerPricing => {
      let _price = _travelerPricing.price;

      let passenger = createPassenger(_travelerPricing);
      currentOffer.offer.passengers.push(passenger);

      let baseFareItemComponents = [];
      _travelerPricing.fareDetailsBySegment.map(_fareSegmentDetail => {
        baseFareItemComponents.push(createFareItemComponent(_fareSegmentDetail.brandedFare, _fareSegmentDetail.fareBasis, _fareSegmentDetail.class));
      });
      let baseFare = createFareItem('base', _price.base, '', baseFareItemComponents);
      let taxes = [];
      _travelerPricing.price.taxes.map(_tax => {
        taxes.push(createTaxItem(_tax.code, _tax.amount, getTaxDefinition(_tax.code)));
      });
      let pricedItem = createPricedItem('offeritem-' + uuidv4(), [passenger._id_], taxes, [baseFare]);


      currentOffer.offer.pricedItems.push(pricedItem);

    });

  });

  return pricedOffers[0];//FIXME - shouldn't we return list?
};

const getTaxDefinition = (taxCode) => {
  let description = taxDefinitions[taxCode] ? taxDefinitions[taxCode] : 'Tax';
  return description;
};

module.exports = { processPriceOfferResponse, createOfferPriceRequest };
