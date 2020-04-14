require('chai').should();
const { selectTierByDepositRate } = require('../../helpers/requirements/apiCallsLimitsHelpers');

describe('Trust Requirements', () => {
  const tiers = [
    {
      min: 0,
      max: 0,
      sec: 1,
      day: 100
    },
    {
      min: 1,
      max: 999,
      sec: 1,
      day: 1000
    },
    {
      min: 1000,
      max: 9999,
      sec: 1,
      day: 10000
    },
    {
      min: 10000,
      max: 0,
      sec: 100,
      day: 0
    }
  ];

  describe('#selectTierByDepositRate', () => {
    const deposits = [
      0,
      300,
      7000,
      20000
    ];
    
    it('should select proper tier according to deposit', async () => {
      const results = deposits.map(d => selectTierByDepositRate(tiers, d));
      results.forEach((r, i) => (r.max).should.equal(tiers[i].max));
    });

    it('should return "undefined" if wrong tier config has been provided', async () => {
      const wrongTiers = tiers.map(t => ({ 'wrong': 'config' }));
      const results = deposits.map(d => selectTierByDepositRate(wrongTiers, d));
      results.forEach(r => (String(r)).should.equal('undefined'));
    });
  });
});
