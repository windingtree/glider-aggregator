const { v4: uuidv4 } = require('uuid');
const GliderError = require('../error');
const OffersModel = require('./mongo/offers');
const { redisClient } = require('../redis');

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
    currency,
    passengers
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
    this.amountAfterTax = amountAfterTax;
    this.currency = currency;
    this.passengers = passengers;
  }
}

class FlightOffer {
  // Constructor
  constructor (
    provider,
    airlineCode,
  ) {
    this.provider = provider;
    this.airlineCode = airlineCode;
  }
}

class OfferManager {
  // Start with an empty list of offers
  constructor () { }

  // Store an offer as an array
  // @todo Decide is this method is really required, if yes then rewrite to mongo
  storeOffersArray (offers) {
    const offerIds = [];
    for (let offer of offers) {
      // Create a random ID
      let offerId = uuidv4();
      offerIds.push(offerId);

      // Store it in Redis
      redisClient.set(
        `offer_${offerId}`,
        JSON.stringify(offer),
        'EX',
        30 * 60,
        (err, res) => {
          if (err) {
            console.log(err);
          }
        }
      );
    }

    // Quite nicely
    return offerIds;
  }

  // Store indexed offers
  storeOffersDict (offers) {
    return Promise.all(
      Object.keys(offers).map(offerId => OffersModel.replaceOne(
        {
          offerId
        },
        {
          offerId,
          offer: offers[offerId]
        },
        {
          multi: true,
          upsert: true
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
        500
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

  async updateOffer (offerId, offer) {
    return OffersModel.replaceOne(
      {
        offerId
      },
      {
        offerId,
        offer: offer
      },
      {
        multi: true,
        upsert: true
      }
    );
  }
}

const offerManager = new OfferManager();

exports.GuestCount = GuestCount;
exports.Rate = Rate;
exports.AccommodationOffer = AccommodationOffer;
exports.FlightOffer = FlightOffer;
exports.offerManager = offerManager;
