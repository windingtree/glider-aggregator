const GliderError = require('../error');
const OffersModel = require('./mongo/offers');

class GuestCount {
  // Constructor
  constructor (type, count) {
    this.type = type;
    this.count = count;
  }
}

class Rate {
  // Constructor
  constructor (
    effectiveDate,
    expireDate,
    timeUnit,
    unitMultiplier,
    currency,
    amountAfterTax,
  ) {
    this.effectiveDate = effectiveDate;
    this.expireDate = expireDate;
    this.timeUnit = timeUnit;
    this.unitMultiplier = unitMultiplier;
    this.currency = currency;
    this.amountAfterTax = amountAfterTax;
  }
}

class AccommodationOffer {
  // Constructor for an accommodation offer
  constructor (
    provider,
    hotelCode,
    rateCode,
    roomTypeCode,
    rates,
    guestCounts,
    effectiveDate,
    expireDate,
    amountBeforeTax,
    amountAfterTax,
    currency
  ) {
    this.provider = provider;
    this.hotelCode = hotelCode;
    this.rateCode = rateCode;
    this.roomTypeCode = roomTypeCode;
    this.rates = rates;
    this.guestCounts = guestCounts;
    this.effectiveDate = effectiveDate;
    this.expireDate = expireDate;
    this.amountBeforeTax = amountBeforeTax;
    this.amountAfterTax = amountAfterTax; // Mandatory for AccommodationOffer and FlightOffer
    this.currency = currency; // Mandatory for AccommodationOffer and FlightOffer
  }
}

class FlightOffer {
  // Constructor
  constructor (
    provider,
    airlineCode,
    expiration,
    offerItems,
    amountAfterTax,
    currency
  ) {
    this.provider = provider;
    this.airlineCode = airlineCode;
    this.expiration = expiration;
    this.offerItems = offerItems;
    this.amountAfterTax = amountAfterTax; // Mandatory for AccommodationOffer and FlightOffer
    this.currency = currency; // Mandatory for AccommodationOffer and FlightOffer
  }
}

class OfferManager {
  // Start with an empty list of offers
  constructor () { }

  saveOffer (offerId, options) {
    return OffersModel.replaceOne(
      {
        offerId
      },
      {
        offerId: options.offerId,
        offer: options.offer
      },
      {
        multi: true,
        upsert: true
      }
    );
  }

  // Store object set of offers
  storeOffers (offers = {}) {
    return Promise.all(
      Object.keys(offers).map(offerId => this.saveOffer(
        offerId,
        {
          offerId,
          offer: offers[offerId]
        }
      ))
    );
  }

  // Get a specific offer
  async getOffer (offerId) {
    let offer;

    if (!offerId) {
      throw new GliderError(
        'Offer Id is required',
        405
      );
    }

    try {
      offer = await OffersModel
        .findOne(
          {
            offerId
          }
        )
        .exec();
    } catch (e) {
      throw new GliderError(
        'Offer expired or not found',
        404
      );
    }

    if (!offer) {
      throw new GliderError(
        'Offer expired or not found',
        404
      );
    }

    offer = offer.offer;
    
    if (offer.airlineCode) {
      offer = Object.assign(new FlightOffer(), offer);
    } else if (offer.hotelCode) {
      offer = Object.assign(new AccommodationOffer(), offer);
    } else {
      throw new GliderError(
        'Unable to cast offer',
        400
      );
    }

    return offer;
  }
}

const offerManager = new OfferManager();

module.exports.GuestCount = GuestCount;
module.exports.Rate = Rate;
module.exports.AccommodationOffer = AccommodationOffer;
module.exports.FlightOffer = FlightOffer;
module.exports.offerManager = offerManager;
