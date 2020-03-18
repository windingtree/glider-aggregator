const parseKeys = obj => {
  Object.keys(obj).forEach((v) => {

    if (v.match(/\./)) {
      const vOrig = v;
      v = v.replace('.', '___');// MongoDB key must not contain '.' symbol
      obj[v] = obj[vOrig];
      delete obj[vOrig];
    }

    if (typeof obj[v] === 'object') {
      obj[v] = parseKeys(obj[v]);
    }
  });

  return obj;
};
module.exports.parseKeys = parseKeys;
