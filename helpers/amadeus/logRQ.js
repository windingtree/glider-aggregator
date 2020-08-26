const fs = require('fs');
const FOLDER = 'C:/projects/windingtree/glider-aggregator/logs';

const logRQRS = (data = '', suffix = '', provider = '') => {
  console.log('log:', suffix);
  let ts = Date.now();
  let extension = 'json';

  try {
    if(typeof data === 'string') {
      if (data.search('<soap') > -1 || data.search('<xml') > -1)
        extension = 'xml';
    }
    if (extension === 'json' && typeof data === 'object')
      data = JSON.stringify(data);
    let filename = `log-${ts}-${suffix}-${provider}.${extension}`;
    console.log('logging to file:'+filename);
    fs.writeFileSync(`${FOLDER}/${filename}`, data);
  } catch (e) {
    console.error('Cant log request', e);
  }


};


module.exports.logRQRS=logRQRS;
