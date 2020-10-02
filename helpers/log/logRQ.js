// eslint-disable-next-line no-unused-vars
const fs = require('fs');
// const { stringifyCircular } = require('../json');

// eslint-disable-next-line no-unused-vars
const logRQRS = (data = '', suffix = '', provider = '') => {
/*
  const FOLDER = '/home/kurt/projects/glider-aggregator/temp';
  let ts = Date.now();
  let extension = 'json';
  try {
    if (typeof data === 'string') {
      if (data.search('<soap') > -1 || data.search('<?xml') > -1)
        extension = 'xml';
    }
    if (extension === 'json' && typeof data === 'object')
      // data = JSON.stringify(data);
      data = stringifyCircular(data);

    let filename = `log-${ts}-${suffix}-${provider}.${extension}`;
    fs.writeFileSync(`${FOLDER}/${filename}`, data);
  } catch (e) {
    console.error('Cant log request', e);
  }
*/

};


module.exports.logRQRS = logRQRS;
