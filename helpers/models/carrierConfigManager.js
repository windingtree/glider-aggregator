const GliderError = require('../error');
const CarrierConfiguration = require('../models/mongo/carrierConfig');
const NodeCache = require('node-cache');

// const CACHE_TTL_SECONDS = 60 * 60;//1hr cache expiry time, this is how long carrier details will be stored in memory before refreshing from mongo
const CACHE_TTL_SECONDS = 60;//for dev purpose - short cache expiry
const cache = new NodeCache({ stdTTL: CACHE_TTL_SECONDS, useClones: false });

const NULL_VALUE = {};    //object to be stored in cache in case carrier details were not found (to indicate it's missing in database and not to query each time it's not found)

/**
 * Retrieve carrier configuration from a database (so far it includes only fare families)
 *
 * @param carrierCode
 * @returns {Promise<unknown>}
 */
const getCarrierDetails = async (carrierCode) => {
  if (!carrierCode) {
    throw new GliderError('Carrier code is required', 405);
  }
  //check if given carrier details are already in cache
  let carrierInfo;
  let cachedValue = cache.get(carrierCode.toUpperCase());

  //IMPORTANT! Performance issue if incorrectly implemented
  //check also if for a given carrier we did not set NULL_VALUE (this was to indicate we already queried database but did not find such carrier in database)
  //if we did store NULL_VALUE - return it (otherwise we would be querying mongo each time for carriers we don't have data in database)!
  if (cachedValue === NULL_VALUE) {
    console.log(`getCarrierDetails(${carrierCode}) - cachedValue is null`);
    return null;
  }

  //check if we have this carrier in cache already - if so, return data from cache
  if (cachedValue !== undefined) {
    console.log(`getCarrierDetails(${carrierCode}) - hit from cache`);
    return cachedValue; //return cached value
  }


  //if we are here - cache did not have any data for requested carrier - check database
  try {
    const model = await CarrierConfiguration();

    carrierInfo = await model.findOne({ carrierCode: { '$regex': carrierCode, $options: 'i' } }).exec();
    console.log(`getCarrierDetails(${carrierCode}) - query DB - result:${carrierInfo}`);

  } catch (e) {
    throw new GliderError('Failed to retrieve carrier configuration', 404);
  }

  //if carrier config was not found in database - we have to indicate this in cache with NULL_VALUE object(we can't use normal 'null')
  if (!carrierInfo) {
    console.log(`getCarrierDetails(${carrierCode}) - value from DB not found - set null in cache`);
    cache.set(carrierCode.toUpperCase(), NULL_VALUE);
  } else {
    console.log(`getCarrierDetails(${carrierCode}) - value from DB is not null`);
    //store retrieved value in cache for future retrieval
    cache.set(carrierCode.toUpperCase(), carrierInfo);
  }
  return carrierInfo;
};

/**
 * Get fare family definition from a database
 * @param carrierCode
 * @param brandedFareId
 * @returns {Promise<null|*>}
 */
const getFareFamily = async (carrierCode, brandedFareId) => {
  let carrierConfig = await getCarrierDetails(carrierCode);
  if (!carrierConfig)
    return null;
  let brand = carrierConfig.brandedFares.filter(brand => (brand.brandedFareId.toLowerCase() === brandedFareId.toLowerCase()));
  if (brand.length > 0)
    return brand[0];
  return null;
};

module.exports = { getCarrierDetails, getFareFamily };
