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

const erevmax = {
  availabilityUrl: process.env.EREVMAX_AVAILABILITY_URL,
  reservationUrl: process.env.EREVMAX_RESERVATION_URL,
};

exports.airFranceConfig = airFranceConfig;
exports.JWT = process.env.JWT;
exports.redisUrl = process.env.REDIS_URL;
exports.mongoUrl = process.env.MONGO_URL;
exports.erevmax = erevmax;
exports.INFURA_URI = `${process.env.INFURA_ENDPOINT}/${process.env.INFURA_PROJECT_ID}`;
exports.GLIDER_DID = `did:orgid:${process.env.GLIDER_ORGID}`;
exports.SIMARD_URL = process.env.SIMARD_URL;
exports.expirationTime = 30 * 60; // 30 min in seconds
exports.expirationLong = 60 * 60 * 24 * 365 * 7; // 7 years in seconds
