const GliderError = require('../error');
const web3 = require('web3');
const { manager: orgIdListsManager } = require('../models/mongo/orgIdLists');
const { manager: apiCallsLimitsManager } = require('../models/mongo/apiCallsLimits');
const { es } = require('../elasticsearch');

// Send calls usage request to the elasticsearch
const getCallsUsage = (index, queries = []) => es.search(
  {
    index,
    body: {
      from: 0,
      size: 1,
      query: {
        bool: {
          must: queries
        }
      }
    }
  },
  {
    ignore: [404]
  }
);

// Select proper tier according to the given LIF token deposit rate
const selectTierByDepositRate = (tiers, deposit) => {
  const selectedTiers = tiers.filter(t => (
    t.min <= deposit &&
      (
        (t.min !== 0 && t.max === 0) ||
        deposit <= t.max
      )
  ));

  return Array.isArray(selectedTiers) && selectedTiers.length === 1
    ? selectedTiers[0]
    : undefined;
};
module.exports.selectTierByDepositRate = selectTierByDepositRate;

module.exports.checkCallsTrustRequirements = async (apiUrl, orgId, lifDeposit) => {
  lifDeposit = Number(web3.utils.fromWei(
    lifDeposit,
    'ether'
  ));

  // Check is organization is in the black list
  const isBlacklisted = await orgIdListsManager.includes(
    'black',
    orgId
  );
  
  if (isBlacklisted) {
    throw new GliderError(
      `The organization: ${orgId} is blocked`,
      403
    );
  }

  // Check is organization is in the white list
  const isWhitelisted = await orgIdListsManager.includes(
    'white',
    orgId
  );

  if (!isWhitelisted) {
    const limits = await apiCallsLimitsManager.get(
      apiUrl.split('?')[0],
      true
    );
    
    let tier;

    if (limits) {
      tier = selectTierByDepositRate(limits.tiers, lifDeposit);
    }

    if (tier) {
      let usageSec;
      let usageDay;

      try {

        if (tier.sec !== 0) {

          usageSec = await getCallsUsage(
            'glider-events',
            [
              {
                range: {
                  time: {
                    gte: 'now-1s',
                    lte: 'now'
                  }
                }
              },
              {
                match: {
                  orgid: orgId
                }
              },
              {
                match: {
                  url: `${apiUrl}*`
                }
              }
            ]
          );

          //console.log('Calls per sec:', usageSec.body.hits.total.value);
        }
        
        if (tier.day !== 0) {

          usageDay = await getCallsUsage(
            'glider-events',
            [
              {
                range: {
                  time: {
                    gte: 'now/d',
                    lte: 'now+1d/d'
                  }
                }
              },
              {
                match: {
                  orgid: orgId
                }
              },
              {
                match: {
                  url: `${apiUrl}*`
                }
              }
            ]
          );

          //console.log('Calls per day:', usageDay.body.hits.total.value);
        }
        
      } catch (e) {
        // Possible elasticsearch API errors should not break normal call flow
        console.error(e);
      }

      // Firstly checking the per second calls limit
      if (usageSec && usageSec.body.hits.total.value >= tier.sec) {
        throw new GliderError(
          'API Call limit reached: Increase your LIF Deposit to make more calls',
          429
        );
      }

      // Check the day calls usage
      if (usageDay && usageDay.body.hits.total.value >= tier.day) {
        throw new GliderError(
          'API Call limit reached: Increase your LIF Deposit to make more calls',
          429
        );
      }
    }
  }
};
