const airFranceConfig = {
  apiKey: process.env.AF_API_KEY,
  commission: process.env.AF_COMISSION,
  AirlineID: process.env.AF_PARTICIPANT_RECIPENT_AIRLINE_ID,
  Party: {
    Sender: {
      TravelAgencySender: {
        Name: process.env.AF_SENDER_NAME,
        PseudoCity: process.env.AF_SENDER_PSEUDOCITY,
        'IATA_Number': process.env.AF_SENDER_IATA_NUMBER,
        AgencyID: process.env.AF_SENDER_AGENCY_ID,
        AgentUser: {
          AgentUserID: process.env.AF_SENDER_AGENT_USER_ID,
        },
      },
    },
    Participants: {
      Participant: {
        EnabledSystemParticipant: {
          SequenceNumber: process.env.AF_PARTICIPANT_ENABLED_SYSTEM_PARTICIPANT_SEQUENCE_NUMBER,
          Name: process.env.AF_PARTICIPANT_ENABLED_SYSTEM_PARTICIPANT_NAME,
          SystemID: process.env.AF_PARTICIPANT_ENABLED_SYSTEM_PARTICIPANT_SYSTEM_ID,
        },
        Recipient: {
          'ORA_Recipient': {
            AirlineID: process.env.AF_PARTICIPANT_RECIPENT_AIRLINE_ID,
            Name: process.env.AF_PARTICIPANT_RECIPENT_NAME,
          },
        },
      },
    },
  },
};

const airCanadaConfig = {
  apiKey: process.env.AC_API_KEY
};

const erevmax = {
  availabilityUrl: process.env.EREVMAX_AVAILABILITY_URL,
  reservationUrl: process.env.EREVMAX_RESERVATION_URL,
};

module.exports.airFranceConfig = airFranceConfig;
module.exports.airCanadaConfig = airCanadaConfig;
module.exports.JWT = process.env.JWT;
module.exports.redisUrl = process.env.REDIS_URL;
module.exports.mongoUrl = process.env.MONGO_URL;
module.exports.elasticUrl = process.env.ELASTIC_URL;
module.exports.erevmax = erevmax;
module.exports.INFURA_URI = `${process.env.INFURA_ENDPOINT}/${process.env.INFURA_PROJECT_ID}`;
module.exports.GLIDER_DID = `did:orgid:${process.env.GLIDER_ORGID}`;
module.exports.GLIDER_ADMIN_DID = `did:orgid:${process.env.GLIDER_ORGID}#${process.env.GLIDER_ADMIN_KEY}`;
module.exports.SIMARD_URL = process.env.SIMARD_URL;
module.exports.expirationTime = 30 * 60; // 30 min in seconds
module.exports.expirationLong = 60 * 60 * 24 * 365 * 7; // 7 years in seconds
