// Parse caller IP from the request
const getCallerIP = (request) => {
  var ip = request.headers['x-forwarded-for'] ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      request.connection.socket.remoteAddress;
  ip = ip.split(',')[0];
  ip = ip.split(':').slice(-1); //in case the ip returned in a format: "::ffff:146.xxx.xxx.xxx"
  return ip;
};

// Send exception event to the elasticsearch
module.exports.indexException = (client, request, error) => setImmediate(async () => {
  try {
    await client.index({
      index: 'glider-exceptions',
      body: {
        method: request.method,
        query: request.query,
        body: request.body,
        url: request.url,
        time: new Date().toISOString(),
        remote: getCallerIP(request),
        message: error.message,
        traceback: error.stack
      }
    });
  } catch(e) {
    console.error(e);
  }
});

// Send common event to the elasticsearch
module.exports.indexEvent = (client, request, response) => setImmediate(async () => {
  try {
    const didDocument =
      request.verificationResult &&
      request.verificationResult.didResult &&
      request.verificationResult.didResult.didDocument
        ? request.verificationResult.didResult.didDocument
        : undefined;
    
    let did;

    if (didDocument) {
      const entity = didDocument.legalEntity || didDocument.organizationalUnit;

      if (entity) {
        did = {
          name: entity.name,
          type: entity.legalType || entity.type.join(', '),
          country: entity.registeredAddress
            ? entity.registeredAddress.country
            : entity.address
              ? entity.address.country
              : undefined
        };
      }
    }

    const endTime = process.hrtime(request.start);

    await client.index({
      index: 'glider-events',
      body: {
        agent: request.verificationResult ? request.verificationResult.iss : undefined,
        method: request.method,
        code: response.statusCode,
        message: response.statusMessage,
        query: request.query,
        body: request.body,
        url: request.url,
        time: new Date().toISOString(),
        remote: getCallerIP(request),
        orgid: didDocument ? didDocument.id : undefined,
        did,
        elapsed: parseInt((endTime[0] * 1000) + (endTime[1]/1000000))
      }
    });
  } catch (e) {
    console.error(e);
  }
});
