
const segmentsByKey = (segmentsArray) => segmentsArray
  .reduce((segments, { _id_, ...others }) => ({
    ...segments,
    [_id_]: others,
  }), {});

const roundCommissionDecimals = (offers) => offers
  .map(({price, ...others}) => ({
    ...others,
    price: {
      ...price,
      commission: price.commission.toFixed(2)
    }
  }));

module.exports = {
  segmentsByKey,
  roundCommissionDecimals,
};
