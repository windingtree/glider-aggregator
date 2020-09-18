const { transformAmadeusResponse } = require('./searchOffersResponseProcessor');
const { createRequest } = require('./searchOffersRequestTemplate');


module.exports = {
  transformAmadeusResponse:transformAmadeusResponse,
  createRequest: createRequest
};
