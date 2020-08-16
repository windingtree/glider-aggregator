// const data = require('./1A-raw-response-offerprice.json');
const { v4: uuidv4 } = require('uuid');
const { createSegment, createPrice, createPassenger } = require('./utils');
// const GliderError = require('../error');

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


const offerPriceResponseProcessor = (response) => {
  const { flightOffers } = response;
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
        let segment = createSegment('seg-' + uuidv4(), _segment);
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
        taxes.push(createTaxItem(_tax.code, _tax.amount, ''));
      });
      let pricedItem = createPricedItem('offeritem-' + uuidv4(), [passenger._id_], taxes, [baseFare]);
      currentOffer.offer.pricedItems.push(pricedItem);

    });

  });

  return pricedOffers[0];//FIXME - shouldn't we return list?
};

/*
let result = offerPriceResponseProcessor(data);
const fs = require('fs');
fs.writeFileSync(`output.json`, JSON.stringify(result));
// console.log(JSON.stringify(result));
*/

module.exports.offerPriceResponseProcessor = offerPriceResponseProcessor;
