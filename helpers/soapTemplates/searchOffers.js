// For documentation, https://github.com/windingtree/simard-schemas/blob/master/ndc/data-mapping.mds
const { convertObjectToXML } = require('./utils/xmlUtils');

// The Passenger object
const mapPassengers = (passengers) => passengers.reduce(
  (list, { Passenger }) => {
    return `${list} 
    <edis:Passenger>
      <edis:PTC>${Passenger.PTC}</edis:PTC>
    </edis:Passenger>
    `;
  },
  ''
);

// The OriginDestination object
const mapOriginDestinations = (OriginDestinations) => OriginDestinations.reduce(
  (list, { OriginDestination }) => {
    return `${list} 
    <edis:OriginDestination>
      <edis:Departure>
          <edis:AirportCode>${OriginDestination.Departure.AirportCode}</edis:AirportCode>
          <edis:Date>${OriginDestination.Departure.Date}</edis:Date>
          <edis:Time>${OriginDestination.Departure.Time}</edis:Time>
      </edis:Departure>
      <edis:Arrival>
          <edis:AirportCode>${OriginDestination.Arrival.AirportCode}</edis:AirportCode>
      </edis:Arrival>
    </edis:OriginDestination>
    `;
  },
  ''
);

// The AirFrance request template
const provideShoppingRequestTemplate_AF = data => `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:edis="http://www.iata.org/IATA/EDIST/2017.1">
  <soapenv:Header>
    <trackingMessageHeader xmlns="http://www.af-klm.com/soa/xsd/MessageHeader-V1_0">
        <consumerRef>
          <userID>w06014962</userID>
          <partyID>${data.Party.Participants.Participant.EnabledSystemParticipant.Name}</partyID>
          <consumerID>w06014962</consumerID>
          <consumerLocation>External</consumerLocation>
          <consumerType>A</consumerType>
          <consumerTime>${data.PointOfSale.RequestTime}</consumerTime>
        </consumerRef>
    </trackingMessageHeader>
    <MessageID xmlns="http://www.w3.org/2005/08/addressing">307d5511-ee5c-4k7b-9f75-25ea761fa31c</MessageID>
    <RelatesTo RelationshipType="http://www.af-klm.com/soa/tracking/InitiatedBy" xmlns="http://www.w3.org/2005/08/addressing">e8fdd9f3-54da-4da1-9b47-5863k09080ca</RelatesTo>
    <RelatesTo RelationshipType="http://www.af-klm.com/soa/tracking/PrecededBy" xmlns="http://www.w3.org/2005/08/addressing">89562767-4cbkk-4e90-a159-1070b25992fc</RelatesTo>
  </soapenv:Header>
  <soapenv:Body>
    <edis:AirShoppingRQ Version="17.1" CorrelationID="3f9ddd-dc6b-41c9-8d4e-8594182ed050">
        <edis:PointOfSale>
          <edis:RequestTime>${data.PointOfSale.RequestTime}</edis:RequestTime>
        </edis:PointOfSale>
        <edis:Document/>
        <edis:Party>
          <edis:Sender>
              <edis:TravelAgencySender>
                <edis:Name>${data.Party.Sender.TravelAgencySender.Name}</edis:Name>
                <edis:PseudoCity>${data.Party.Sender.TravelAgencySender.PseudoCity}</edis:PseudoCity>
                <edis:IATA_Number>${data.Party.Sender.TravelAgencySender.IATA_Number}</edis:IATA_Number>
                <edis:AgencyID>${data.Party.Sender.TravelAgencySender.AgencyID}</edis:AgencyID>
                <edis:AgentUser>
                    <edis:AgentUserID>${data.Party.Sender.TravelAgencySender.AgentUser.AgentUserID}</edis:AgentUserID>
                </edis:AgentUser>
              </edis:TravelAgencySender>
          </edis:Sender>
          <edis:Participants>
              <edis:Participant>
                <edis:EnabledSystemParticipant SequenceNumber="${data.Party.Participants.Participant.EnabledSystemParticipant.SequenceNumber}">
                    <edis:Name>${data.Party.Participants.Participant.EnabledSystemParticipant.Name}</edis:Name>
                    <edis:SystemID>${data.Party.Participants.Participant.EnabledSystemParticipant.SystemID}</edis:SystemID>
                </edis:EnabledSystemParticipant>
              </edis:Participant>
          </edis:Participants>
          <edis:Recipient>
              <edis:ORA_Recipient>
                <edis:AirlineID>${data.Party.Participants.Participant.Recipient.ORA_Recipient.AirlineID}</edis:AirlineID>
                <edis:Name>${data.Party.Participants.Participant.Recipient.ORA_Recipient.Name}</edis:Name>
              </edis:ORA_Recipient>
          </edis:Recipient>
        </edis:Party>
        <edis:CoreQuery>
          <edis:OriginDestinations>
            ${mapOriginDestinations(data.CoreQuery.OriginDestinations)}
          </edis:OriginDestinations>
        </edis:CoreQuery>
        <edis:Preference>
          <edis:CabinPreferences>
              <edis:CabinType>
                <edis:Code>${data.CoreQuery.Preference.CabinPreferences.CabinType.Code}</edis:Code>
              </edis:CabinType>
          </edis:CabinPreferences>
        </edis:Preference>
        <edis:DataLists>
          <edis:PassengerList>
            ${mapPassengers(data.CoreQuery.DataLists.PassengerList)}
          </edis:PassengerList>
        </edis:DataLists>
    </edis:AirShoppingRQ>
  </soapenv:Body>
</soapenv:Envelope>`;
module.exports.provideShoppingRequestTemplate_AF = provideShoppingRequestTemplate_AF;

const provideShoppingRequestTemplate_AC = data => `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:v2="http://sita.aero/NDC/NDCUtility/v2">
<soapenv:Header/>
<soapenv:Body>
  <v2:NDCMSG_Envelope>
      <NDCMSG_Header>
          <Function>AirShoppingRQ</Function>
          <SchemaType>NDC</SchemaType>
          <SchemaVersion>YY.2017.2</SchemaVersion>
          <RichMedia>true</RichMedia>
          <Sender>
            <Address>
                <Company>WindingTree</Company>
                <NDCSystemId>DEV</NDCSystemId>
            </Address>
          </Sender>
          <Recipient>
            <Address>
              <Company>AC</Company>
              <NDCSystemId>DEV</NDCSystemId>
            </Address>
          </Recipient>
      </NDCMSG_Header>
      <NDCMSG_Body>
          <NDCMSG_Payload>
            <AirShoppingRQ Version="2017.2" xmlns="http://www.iata.org/IATA/EDIST/2017.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
              ${convertObjectToXML(data).join('')}
            </AirShoppingRQ>
          </NDCMSG_Payload>
      </NDCMSG_Body>
  </v2:NDCMSG_Envelope>
</soapenv:Body>
</soapenv:Envelope>`;
module.exports.provideShoppingRequestTemplate_AC = provideShoppingRequestTemplate_AC;
