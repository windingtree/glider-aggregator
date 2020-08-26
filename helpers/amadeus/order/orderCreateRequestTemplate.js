const { convertGenderFromGliderToAmadeus } = require('../utils/amadeusFormatUtils');
const GliderError = require('../../error');

const createTraveller = (id, pax) => {
  const {gender, firstnames, lastnames, birthdate, contactInformation} = pax;
  const email = contactInformation && contactInformation.length>1?contactInformation[1]:null;
  const phone = contactInformation && contactInformation.length>0?contactInformation[0]:null;
  if(!email) throw new GliderError(`Missing email address for passenger ${id}`);
  if(!phone) throw new GliderError(`Missing phone number for passenger ${id}`);
  //FIXME - hardcoded pax type
  return {
    id: id,
    dateOfBirth: birthdate.substr(0,10),
    name: {
      firstName: firstnames.join(' '),
      lastName: lastnames.join(' '),
    },
    gender: convertGenderFromGliderToAmadeus(gender),
    contact: {
      emailAddress: email,
      phones: [{
        deviceType: 'MOBILE',
        countryCallingCode: '1',  //TODO remove hardcoded
        number: phone,
      }],
    },
    documents: []
  };
};

const orderCreateRequestTemplate_1A  = (order, body, guaranteeClaim) => {
  //create list of passengers to be sent to Amadeus (convert pax details from Glider API format)
  let passengers = [];

  let originalPaxIds = order.extraData.rawOffer.travelerPricings.map(traveller=>traveller.travelerId);

  let mappedPassengers = order.extraData.mappedPassengers;

  let idx=0;
  Object.keys(body.passengers).map(paxId=>{
    let pax = body.passengers[paxId];
    let amadeusPaxId = mappedPassengers[paxId];
    let traveller = createTraveller(amadeusPaxId, pax);
    passengers.push(traveller);
  });

  let rawOffer=order.extraData.rawOffer;

  let request =  {
    data: {
      type: 'flight-order',
      flightOffers: [rawOffer],
      travelers: [...passengers]
    }

  };

  // request.data.flightOffers.push(...offers);
  return request;
};




module.exports.orderCreateRequestTemplate_1A=orderCreateRequestTemplate_1A;



let order = {
  'provider': '1A',
  'airlineCode': '1A',
  'expiration': '2020-08-17',
  'offerItems': {
    'offeritem-0c799358-cfcb-41fd-b2c1-7e74b85d354c': {
      'passengerReferences': ''
    },
    'offeritem-2d123784-7e52-43f1-b24d-2984a50175fc': {
      'passengerReferences': ''
    }
  },
  'amountAfterTax': '202.04',
  'currency': 'USD',
  'extraData': {
    'segments': [
      {
        '_id_': 'seg-a79e58b4-0a84-4598-bc81-71243094e865',
        'operator': {
          'operatorType': 'airline',
          'iataCode': 'BA',
          'iataCodeM': 'BA',
          'flightNumber': '329'
        },
        'origin': {
          'locationType': 'airport',
          'iataCode': 'CDG'
        },
        'destination': {
          'locationType': 'airport',
          'iataCode': 'LHR'
        },
        'departureTime': '2020-09-17T21:50:00',
        'arrivalTime': '2020-09-17T22:00:00',
        'Departure': {
          'AirportCode': 'CDG'
        },
        'Arrival': {
          'AirportCode': 'LHR'
        },
        'index': 'CDGLHR'
      }
    ],
    'destinations': [],
    'mappedPassengers': {
      '2906A0F2': 'pax-d2d3a6b4-c773-4cda-983e-210b29c5b8d9',
      '48A5F57F': 'pax-67665b24-7e65-4d8d-b45f-7146f37e35a9'
    },
    'passengers': {
      'ADT': [
        '2906A0F2'
      ],
      'CHD': [
        '48A5F57F'
      ]
    },
    'options': [],
    'seats': {},
    'rawOffer': {
      'type': 'flight-offer',
      'id': '1',
      'source': 'GDS',
      'instantTicketingRequired': false,
      'nonHomogeneous': false,
      'oneWay': false,
      'lastTicketingDate': '2020-08-17',
      'numberOfBookableSeats': 9,
      'itineraries': [
        {
          'duration': 'PT1H10M',
          'segments': [
            {
              'departure': {
                'iataCode': 'CDG',
                'terminal': '2A',
                'at': '2020-09-17T21:50:00'
              },
              'arrival': {
                'iataCode': 'LHR',
                'terminal': '5',
                'at': '2020-09-17T22:00:00'
              },
              'carrierCode': 'BA',
              'number': '329',
              'aircraft': {
                'code': '321'
              },
              'operating': {
                'carrierCode': 'BA'
              },
              'duration': 'PT1H10M',
              'id': '1',
              'numberOfStops': 0,
              'blacklistedInEU': false
            }
          ]
        }
      ],
      'price': {
        'currency': 'USD',
        'total': '202.04',
        'base': '126.00',
        'fees': [
          {
            'amount': '0.00',
            'type': 'SUPPLIER'
          },
          {
            'amount': '0.00',
            'type': 'TICKETING'
          }
        ],
        'grandTotal': '202.04'
      },
      'pricingOptions': {
        'fareType': [
          'PUBLISHED'
        ],
        'includedCheckedBagsOnly': false
      },
      'validatingAirlineCodes': [
        'BA'
      ],
      'travelerPricings': [
        {
          'travelerId': '1',
          'fareOption': 'STANDARD',
          'travelerType': 'ADULT',
          'price': {
            'currency': 'USD',
            'total': '101.02',
            'base': '63.00'
          },
          'fareDetailsBySegment': [
            {
              'segmentId': '1',
              'cabin': 'ECONOMY',
              'fareBasis': 'OZ0HO',
              'brandedFare': 'NOBAG',
              'class': 'O',
              'includedCheckedBags': {
                'quantity': 0
              }
            }
          ]
        },
        {
          'travelerId': '2',
          'fareOption': 'STANDARD',
          'travelerType': 'CHILD',
          'price': {
            'currency': 'USD',
            'total': '101.02',
            'base': '63.00'
          },
          'fareDetailsBySegment': [
            {
              'segmentId': '1',
              'cabin': 'ECONOMY',
              'fareBasis': 'OZ0HO',
              'brandedFare': 'NOBAG',
              'class': 'O'
            }
          ]
        }
      ]
    },
    'originOffers': [
      'offer-5f97548b-5a7d-4466-a978-fd0211edca75'
    ]
  },
  'offerId': 'offer-5f97548b-5a7d-4466-a978-fd0211edca75',
  'isPriced': true,
  'isReturnTrip': false
};
var body = {
  'offerId': 'offer-cbe8e81c-069c-49c1-b8da-f60952a4ffc7',
  'offerItems': null,
  'passengers': {
    'PAX1': {
      'type': 'ADT',
      'civility': 'MR',
      'lastnames': ['Marley'],
      'firstnames': ['Bob'],
      'gender': 'Male',
      'birthdate': '1980-03-21T00:00:00Z',
      'contactInformation': ['+32123456789', 'contact@org.co.uk'],
    },
  },
};


let result = orderCreateRequestTemplate_1A(order, body);

console.log('Result:', JSON.stringify(result));
