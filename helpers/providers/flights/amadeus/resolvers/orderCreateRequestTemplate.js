const { convertGenderFromGliderToAmadeus } = require('../utils/amadeusFormatUtils');
const GliderError = require('../../../../error');
const config = require('../../../../../config').amadeusGdsConfig;

const createTraveller = (id, pax) => {
  const { civility, firstnames, lastnames, birthdate, contactInformation } = pax;
  const email = contactInformation && contactInformation.length > 1 ? contactInformation[1] : null;
  const phone = contactInformation && contactInformation.length > 0 ? contactInformation[0] : null;
  if (!email) throw new GliderError(`Missing email address for passenger ${id}`);
  if (!phone) throw new GliderError(`Missing phone number for passenger ${id}`);
  //FIXME - hardcoded pax type
  return {
    id: id,
    dateOfBirth: birthdate.substr(0, 10),
    name: {
      firstName: firstnames.join(' '),
      lastName: lastnames.join(' '),
    },
    gender: convertGenderFromGliderToAmadeus(civility),
    contact: {
      emailAddress: email,
      phones: [{
        deviceType: 'MOBILE',
        countryCallingCode: '1',  //TODO remove hardcoded
        number: phone,
      }],
    },
    documents: [],
  };
};

const orderCreateRequestTemplate_1A = (order, body) => {
  //create list of passengers to be sent to Amadeus (convert pax details from Glider API format)
  let passengers = [];

  let mappedPassengers = order.extraData.mappedPassengers;  //glider ID to Amadeus ID map
  let passengerTypeToIdMap = order.extraData.passengers;    //pax type (ADT, CHD, INF) to gliderID


  Object.keys(body.passengers).map(paxId => {
    let pax = body.passengers[paxId];
    let paxType = pax.type;
    let gliderPaxId = passengerTypeToIdMap[paxType].pop();
    let amadeusPaxId = mappedPassengers[gliderPaxId];
    let traveller = createTraveller(amadeusPaxId, pax);
    passengers.push(traveller);
  });

  let rawOffer = order.extraData.rawOffer;

  let request = {
    data: {
      type: 'flight-order',
      queuingOfficeId: config.queueingOfficeId,
      flightOffers: [rawOffer],
      travelers: [...passengers],
    },
  };
  //caution - during testing it was failing if request.data.ownerOfficeId was specified!
  if(config.ownerOfficeId){
    console.log(`ownerOfficeId is specified - using that to create a booking:${config.ownerOfficeId}`);
    request.data.ownerOfficeId=config.ownerOfficeId;
  }
  // request.data.flightOffers.push(...offers);
  return request;
};


module.exports.orderCreateRequestTemplate_1A = orderCreateRequestTemplate_1A;

