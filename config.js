/*
 * config.js - Provides configuration
 *
 * Variables are retrieved by order of priority:
 * - From an environment specific variable: STAGING_.., if any
 * - From the environment variable, if any
 * - From a default value configured in this file
 *
 * Environment is determined from:
 * - The GLIDER_ENV variable, if any
 * - The Github's branch, if the deployment is made using the Vercel/Github integration
 * - Defaults to 'staging', including local
 */
let buildEnv;
try {
  buildEnv = require('./env.json');
} catch (err) {}

// Define the current environment
const determineEnviroment = () => {
  // If defined, use the Glider environment variable
  if(process.env.GLIDER_ENV) {
    return process.env.GLIDER_ENV;
  }

  // If env.json file present, use it
  if(buildEnv) {
    return buildEnv.environment;
  }

  // Otherwise use the Github branch provided by Vercel
  switch(process.env.VERCEL_GITHUB_COMMIT_REF || process.env.NOW_GITHUB_COMMIT_REF) {
    case 'master':
      return 'production';
    case 'develop':
    default:
      return 'staging';
  }
}

const environment = determineEnviroment();

// Get an an environment variable
const getConfigKey = (key) => {
  // Return environment specific variable if any
  const envKey = `${environment.toUpperCase()}_${key}`;
  if(process.env.hasOwnProperty(envKey)) {
    return process.env[envKey];
  }

  // Return variable key
  if(process.env.hasOwnProperty(key)) {
    return process.env[key];
  }

  // Config key does not exist
  return undefined;
};

const airFranceConfig = {
  apiKey: getConfigKey('AF_API_KEY'),
  commission: getConfigKey('AF_COMISSION') || '0',
  AirlineID: getConfigKey('AF_PARTICIPANT_RECIPENT_AIRLINE_ID') || 'AF',
  Party: {
    Sender: {
      TravelAgencySender: {
        Name: getConfigKey('AF_SENDER_NAME') || 'Test',
        PseudoCity: getConfigKey('AF_SENDER_PSEUDOCITY') || 'PARMM211L',
        'IATA_Number': getConfigKey('AF_SENDER_IATA_NUMBER') || '12345675',
        AgencyID: getConfigKey('AF_SENDER_AGENCY_ID') || 'id',
        AgentUser: {
          AgentUserID: getConfigKey('AF_SENDER_AGENT_USER_ID') || '1234',
        },
      },
    },
    Participants: {
      Participant: {
        EnabledSystemParticipant: {
          SequenceNumber: getConfigKey('AF_PARTICIPANT_ENABLED_SYSTEM_PARTICIPANT_SEQUENCE_NUMBER') || '12',
          Name: getConfigKey('AF_PARTICIPANT_ENABLED_SYSTEM_PARTICIPANT_NAME') || 'MASHERY',
          SystemID: getConfigKey('AF_PARTICIPANT_ENABLED_SYSTEM_PARTICIPANT_SYSTEM_ID') || 'MAS',
        },
        Recipient: {
          'ORA_Recipient': {
            AirlineID: getConfigKey('AF_PARTICIPANT_RECIPENT_AIRLINE_ID') || 'AF',
            Name: getConfigKey('AF_PARTICIPANT_RECIPENT_NAME') || 'AIRFRANCE',
          },
        },
      },
    },
  },
};

const airCanadaConfig = {
  apiKey: getConfigKey('AC_API_KEY'),
  commission: getConfigKey('AC_COMISSION') || '0',
  baseUrl: getConfigKey('AC_BASEURL') || (environment === 'production' ? 'https://ndcexchange.mconnect.aero/messaging/v2/ndc-exchange/' : 'https://ndchub.mconnect.aero/messaging/v2/ndc-exchange/'),
  baseUrlPci: getConfigKey('AC_BASEURL_PCI') || (environment === 'production' ? 'https://pci.ndcexchange.mconnect.aero/messaging/v2/ndc-exchange/' : 'https://pci.ndchub.mconnect.aero/messaging/v2/ndc-exchange/'),
  AirlineID: getConfigKey('AC_PARTICIPANT_RECIPENT_AIRLINE_ID') || 'AC',
  PointOfSale: {
    Location: {
      CountryCode: {
        '@value': getConfigKey('AC_POS_COUNTRY_CODE') || 'CA'
      }
    },
    TouchPoint: {
      Device: {
        Code: getConfigKey('AC_POS_DEVICE_CODE') || '0.AAA.X',
        TableName: {}
      }
    }
  },
  Document: {
    '@id': getConfigKey('AC_DOCUMENT_ID') || 'OneWay',
    Name: getConfigKey('AC_DOCUMENT_NAME') || 'NDC-Exchange',
    ReferenceVersion: getConfigKey('AC_DOCUMENT_REFERENCE_VERSION') || 'UAT-OTA-2010B'
  },
  Party: {
    Participants: {
      Participant: {
        EnabledSystemParticipant: {
          '@SequenceNumber': getConfigKey('AC_PARTICIPANT_ENABLED_SYSTEM_PARTICIPANT_SEQUENCE_NUMBER') || '1',
          Name: getConfigKey('AC_USERNAME') || getConfigKey('AC_PARTICIPANT_ENABLED_SYSTEM_PARTICIPANT_NAME'),
          Category: getConfigKey('AC_PARTICIPANT_ENABLED_SYSTEM_PARTICIPANT_CATEGORY') || 'DC',
          SystemID: {
            '@Owner': getConfigKey('AC_PARTICIPANT_ENABLED_SYSTEM_PARTICIPANT_SYSTEM_ID_OWNER') || 'ADS',
            '@value': getConfigKey('AC_PASSWORD') || getConfigKey('AC_PARTICIPANT_ENABLED_SYSTEM_PARTICIPANT_SYSTEM_ID'),
          }
        }
      }
    }
  }
};
const amadeusGdsConfig = {  //TEST
  clientId: getConfigKey('AMADEUS_CLIENT_ID') ,
  clientSecret: getConfigKey('AMADEUS_CLIENT_SECRET'),
  hostname: getConfigKey('AMADEUS_ENVIRONMENT') || 'test',
  queueingOfficeId: getConfigKey('AMADEUS_QUEUE_OFFICE_ID') ,
  ownerOfficeId: getConfigKey('AMADEUS_OWNERSHIP_OFFICE_ID'),
};

const erevmax = {
  availabilityUrl: getConfigKey('EREVMAX_AVAILABILITY_URL') || 'https://ota-simulator.now.sh/api?ota=OTA_HotelAvailRS.xml',
  reservationUrl: getConfigKey('EREVMAX_RESERVATION_URL') || 'https://ota-simulator.now.sh/api?ota=OTA_HotelResNotifRS_commit.xml',
  cancellationUrl: getConfigKey('EREVMAX_CANCELLATION_URL') || 'https://ota-simulator.now.sh/api?ota=OTA_HotelResNotifRS_cancel.xml',
};

module.exports.debugInfo = () => {
  return {
    environment: environment,
    erevmax: erevmax,
    env: process.env,
    buildEnv: buildEnv,
  }
}

module.exports.airFranceConfig = airFranceConfig;
module.exports.airCanadaConfig = airCanadaConfig;
module.exports.amadeusGdsConfig = amadeusGdsConfig;
module.exports.erevmax = erevmax;
module.exports.redisUrl = getConfigKey('REDIS_URL') || 'redis://localhost:6379';
module.exports.mongoUrl = getConfigKey('MONGO_URL') || 'mongodb://localhost/glider';
module.exports.elasticUrl = getConfigKey('ELASTIC_URL') || 'http://localhost:9200';
module.exports.INFURA_URI = `${getConfigKey('INFURA_ENDPOINT')}/${getConfigKey('INFURA_PROJECT_ID')}`;
module.exports.GLIDER_DID = `did:orgid:${getConfigKey('GLIDER_ORGID') || '0x71cd1781a3082f33d2521ac8290c9d4b3b3b116e4e8548a4914b71a1f7201da0'}`;
module.exports.GLIDER_ADMIN_DID = `did:orgid:${getConfigKey('GLIDER_ORGID') || '0x71cd1781a3082f33d2521ac8290c9d4b3b3b116e4e8548a4914b71a1f7201da0'}#${getConfigKey('GLIDER_ADMIN_KEY') || ''}`;
module.exports.SIMARD_URL = getConfigKey('SIMARD_URL') || `https://${environment}.api.simard.io/api/v1`;
module.exports.SIMARD_JWT = getConfigKey('SIMARD_JWT') || getConfigKey('JWT');
module.exports.LIF_MIN_DEPOSIT = getConfigKey('LIF_MIN_DEPOSIT') || '0';
module.exports.expirationTime = 30 * 60; // 30 min in seconds
module.exports.expirationLong = 60 * 60 * 24 * 365 * 7; // 7 years in seconds
module.exports.ETHEREUM_NETWORK = getConfigKey('ETHEREUM_NETWORK') || 'ropsten';
module.exports.environment = environment;
