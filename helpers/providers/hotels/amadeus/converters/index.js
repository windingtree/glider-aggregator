const { createSearchRequest, processSearchResponse } = require('./searchHotelsRequestResponseConverters');
const { processOrderResponse, createOrderRequest } = require('./orderCreateRequestResponseConverters');


module.exports = { createSearchRequest, processSearchResponse, processOrderResponse, createOrderRequest };
