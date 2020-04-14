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
