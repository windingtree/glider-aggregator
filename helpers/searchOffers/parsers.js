const reduceToProperty = (object, property) =>  Object.keys(object)
  .map((key)=> {
    return {
      [key]: object[key][property]
    }
  });

const splitSegments = (combinations) => combinations.map(({_items_, ...others})=> ({
  ...others,
  _items_ : _items_.split(' '),
}));

const reduceToObjectByKey = (array) => array
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
  reduceToObjectByKey,
  roundCommissionDecimals,
  splitSegments,
  reduceToProperty,
};
