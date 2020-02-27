
const { v4: uuidv4 } = require('uuid');
const redis = require("redis");
const config = require('../../config');
const redisClient = redis.createClient(config.redisUrl);

class GuestCount {
    // Constructor
    constructor(type, count) {
        this.type = type;
        this.count = count;
    }
}

class Rate {
    // Constructor
    constructor(
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
    constructor(
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
        this.amountAfterTax = amountAfterTax;
        this.currency = currency;
    }
}


class FlightOffer {
    // Constructor
    constructor(
        provider,
        airlineCode,
    ) {
        this.provider = provider;
        this.airlineCode = airlineCode;
    }
}

class OfferManager {
    // Start with an empty list of offers
    constructor () {
        //this.client = redis.createClient(config.redisUrl);
        //this.client.on("error", function(error) {
        //    console.error(error);
        //});
        process.on("exit", function(){
            redisClient.quit();
        });
    }

    // Store an offer as an array
    storeOffersArray(offers) {
        offerIds = [];
        for(let offer of offers) {
            // Create a random ID
            let offerId = uuidv4();
            offerIds.push(offerId);

            // Store it in Redis
            redisClient.set(`offer_${offerId}`, JSON.stringify(offer), 'EX', 30*60, function(err, res) {
                if(err) console.log(err);
            });
        }

        // Quite nicely
        return offerIds;
    }

    // Store indexed offers
    storeOffersDict(offers) {
        for(let offerId in offers) {
            redisClient.set(`offer_${offerId}`, JSON.stringify(offers[offerId]), 'EX', 30*60, function(err, res) {
                if(err) console.log(err);
            });
        }
        return true;
    }

    // Get a specific offer
    getOffer(offerId) {
        return new Promise((resolve, reject) => {
            redisClient.get(`offer_${offerId}`, function(err, res) {                
                // Handle error
                if(err) {
                    reject(err);
                }
                else if(res == null) {
                    reject({message:'Offer expired or not found', code:404});
                }

                // Cast the result and resolve
                else {
                    let offerObject = JSON.parse(res);
                    if(offerObject.airlineCode) {
                        resolve(Object.assign(new FlightOffer(), offerObject));
                    }
                    else if(offerObject.hotelCode) {
                        resolve(Object.assign(new AccommodationOffer(), offerObject));
                    }
                    else {
                        reject('Unable to cast offer');
                    }
                    
                }
            });
            
        });
    }

}

const offerManager = new OfferManager();

exports.GuestCount = GuestCount;
exports.Rate = Rate;
exports.AccommodationOffer = AccommodationOffer;
exports.FlightOffer = FlightOffer;
exports.offerManager = offerManager;
