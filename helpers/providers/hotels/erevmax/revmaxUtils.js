const axios = require('axios');

const revmaxRequest = async (url, body) => {
  return await axios.post(url, body, {
    headers: {
      'Content-Type': 'application/xml',
      SOAPAction: 'http://www.opentravel.org/OTA/2003/05/getOTAHotelAvailability',
    },
  },
  );
};


module.exports = {
  revmaxRequest: revmaxRequest,
};
