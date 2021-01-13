const GliderError = require('../error');
const CarrierConfiguration = require('../models/mongo/carrierConfig');


let cache;  //this is cache which will store all carriers configurations, carrier code (uppercase) is a key, value is configuration record

const ensureCarrierConfigurationCacheIsPopulated = async () => {
  if(cache)
  {
    console.log('');
    return;
  }
  //if we are here - cache did not have any data yet - load it from DB
  try {
    const model = await CarrierConfiguration();
    let records = await model.find({}).exec();
    cache = records.reduce((map, obj)=>{
      let carrierCode = obj.carrierCode.toUpperCase();
      map[carrierCode] = obj;
      return map;
    }, {});
  } catch (e) {
    console.error(e);
    throw new GliderError('Failed to retrieve carrier configuration', 404);
  }
};

/**
 * Retrieve carrier configuration from a database.
 * It uses lazy caching - at the beginning all carriers are retrieved and stored locally. When certain carrier is requested, it's returned from cache.
 *
 * @param carrierCode
 * @returns {Promise<unknown>}
 */
const getCarrierDetails = async (carrierCode) => {
  if (!carrierCode) {
    throw new GliderError('Carrier code is required', 405);
  }

  //if needed - populate cache with carriers configurations
  await ensureCarrierConfigurationCacheIsPopulated();
  //check if given carrier details are already in cache
  let result = cache[carrierCode.toUpperCase()];
  if(!result)
    return null;
  return result;
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
