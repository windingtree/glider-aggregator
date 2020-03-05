const airFranceConfig = {
  apiKey: process.env.AF_API_KEY,
  commission: process.env.AF_COMISSION,
  AirlineID: process.env.AF_PARTICIPANT_RECIPENT_AIRLINE_ID,
  Party: {
    Sender: {
      TravelAgencySender: {
        Name: process.env.AF_SENDER_NAME,
        PseudoCity: process.env.AF_SENDER_PSEUDOCITY,
        IATA_Number: process.env.AF_SENDER_IATA_NUMBER,
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
          ORA_Recipient: {
            AirlineID: process.env.AF_PARTICIPANT_RECIPENT_AIRLINE_ID,
            Name: process.env.AF_PARTICIPANT_RECIPENT_NAME,
          },
        },
      },
    },
  },
};

const JWT = process.env.JWT;

const redisUrl = process.env.REDIS_URL;

const erevmax = {
  availabilityUrl: process.env.EREVMAX_AVAILABILITY_URL,
  reservationUrl: process.env.EREVMAX_RESERVATION_URL,
};


exports.airFranceConfig = airFranceConfig;
exports.JWT = JWT;
exports.redisUrl = redisUrl;
exports.erevmax = erevmax;