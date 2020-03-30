const { errors } = require('@elastic/elasticsearch');

// Parse caller IP from the request
const getCallerIP = request => {
  let ip = request.headers['x-forwarded-for'] ||
    request.connection.remoteAddress ||
    request.socket.remoteAddress ||
    request.connection.socket.remoteAddress;
  ip = ip.split(',')[0];
  ip = ip.split(':').slice(-1); //in case the ip returned in a format: "::ffff:146.xxx.xxx.xxx"
  return ip[0];
};

// Parse caller Host from the request
const getCallerHost = request => {
  return request.headers['x-forwarded-host'] ||
  request.headers.host;
};

// Extract response message and code from the response object
const parseResponseCode = (response, data) => {
  const code = `${response.statusCode} ${response.statusMessage}`;
  let message;

  if (response.exception) {
    message = typeof data === 'object' ? JSON.stringify(data) : data;
  } else {
    message = 'OK';
  }

  return {
    message,
    code
  };
};

// Create properties mapping for index
const createMapping = async (client, mapping) => {
  return await client.indices.create(
    mapping,
    {
      ignore: [400]
    });
};

// Send exception event to the elasticsearch
module.exports.indexException = (client, args) => setImmediate(async () => {
  const [request, response, data] = args;

  try {
    const { message, code } = parseResponseCode(response, data);

    await createMapping(
      client,
      {
        index: 'glider-exceptions',
        body: {
          mappings: {
            properties: {
              method: { type: 'keyword' },
              query: { type: 'object' },
              body: { type: 'object' },
              url: { type: 'text' },
              host: { type: 'text' },
              time: { type: 'date' },
              remote: { type: 'text' },
              message: { type: 'text' },
              code: { type: 'text' },
              traceback: { type: 'text' }
            }
          }
        }
      }
    );

    const result = await client.index({
      index: 'glider-exceptions',
      body: {
        method: request.method,
        query: request.query,
        body: request.body,
        url: request.url,
        host: getCallerHost(request),
        time: new Date().toISOString(),
        remote: getCallerIP(request),
        message,
        code,
        traceback: response.exception.stack
      }
    });

    if (result instanceof errors.ResponseError) {
      console.log('Elastic error: ', result);
    }
  } catch(e) {
    console.error(e);
  }
});

// Send common event to the elasticsearch
module.exports.indexEvent = (client, args) => setImmediate(async () => {
  const [request, response, data] = args;

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
          name: entity.name || entity.legalName,
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
    const { message, code } = parseResponseCode(response, data);

    await createMapping(
      client,
      {
        index: 'glider-events',
        body: {
          mappings: {
            properties: {
              agent: { type: 'text' },
              method: { type: 'keyword' },
              query: { type: 'object' },
              body: { type: 'object' },
              url: { type: 'text' },
              host: { type: 'text' },
              time: { type: 'date' },
              remote: { type: 'text' },
              orgid: { type: 'text' },
              did: { type: 'object' },
              elapsed: { type: 'integer' },
              message: { type: 'text' },
              code: { type: 'text' }
            }
          }
        }
      }
    );

    const result = await client.index({
      index: 'glider-events',
      body: {
        agent: request.verificationResult ? request.verificationResult.iss : '',
        method: request.method,
        query: request.query,
        body: request.body,
        url: request.url,
        host: getCallerHost(request),
        time: new Date().toISOString(),
        remote: getCallerIP(request),
        orgid: request.verificationResult && request.verificationResult.didResult
          ? request.verificationResult.didResult.id
          : '',
        did,
        elapsed: parseInt((endTime[0] * 1000) + (endTime[1]/1000000)),
        message,
        code
      }
    });

    if (result instanceof errors.ResponseError) {
      console.log('Elastic error: ', result);
    }
  } catch (e) {
    console.error(e);
  }
});
