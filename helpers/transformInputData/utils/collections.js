// Remove objects duplicates from the array
module.exports.uniqueObjectsList = arrayOfObjects => arrayOfObjects
  .map(o => JSON.stringify(o))
  .filter((o, index, array) => array.indexOf(o) === index)
  .map(o => JSON.parse(o));

module.exports.flatOneDepth = array => array.reduce((a, v) => a.concat(v), []);
