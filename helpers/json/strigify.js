// Stringify object with circular structures
const stringifyCircular = (obj, indent = null) => {
  let cache = [];

  return JSON.stringify(obj, (key, value) => {

    if (value instanceof Error) {

      const obj = {};
      Object.getOwnPropertyNames(value).forEach(key => {
        obj[key] = value[key];
      });

      return obj;
    }

    if (typeof value === 'object' && value !== null) {

      if (cache.indexOf(value) >= 0) {

        return;
      }

      cache.push(value);
    }

    return value;
  }, indent ? indent : undefined);
};
module.exports.stringifyCircular = stringifyCircular;
