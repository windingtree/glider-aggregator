const { convertObjectToXML } = require('./utils/xmlUtils');

const EMAIL_REGEXP =
  /^(?=.{1,254}$)(?=.{1,64}@)[-!#$%&'*+/0-9=?A-Z^_`a-z{|}~]+(\.[-!#$%&'*+/0-9=?A-Z^_`a-z{|}~]+)*@[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*$/;
  const isEmail = (value) => EMAIL_REGEXP.test(value);

const mapOfferItems = (offerItems) => Object.entries(offerItems)
  .reduce((items, [key, { passengerReferences }]) => `${items}
        <iata:OfferItem OfferItemID="${key}">
          <iata:PassengerRefs>${passengerReferences}</iata:PassengerRefs>
        </iata:OfferItem>`, '');

const mapPassengerList = (passengers) => Object.keys(passengers)
  .reduce((list, key, index) => {
    const passenger = passengers[key];
    return `${list}
      <iata:Passenger PassengerID="${key}">
        <iata:PTC>${passenger.type}</iata:PTC>
        <iata:Individual>
          <iata:Birthdate>${passenger.birthdate}</iata:Birthdate>
          <iata:NameTitle>${passenger.civility}</iata:NameTitle>
          <iata:GivenName>${passenger.firstnames.join(' ')}</iata:GivenName>
          <iata:Surname>${passenger.lastnames.join(' ')}</iata:Surname>
        </iata:Individual>
        <iata:ContactInfoRef>CTC${index + 1}</iata:ContactInfoRef>
      </iata:Passenger>`;
  }, '');

const emailTemplate = (value) => `<iata:EmailAddress>
    <iata:EmailAddressValue>${value}</iata:EmailAddressValue>
  </iata:EmailAddress>`;

const phoneTemplate = (value) => `<iata:Phone>
    <iata:PhoneNumber>${value}</iata:PhoneNumber>
  </iata:Phone>`;

const mapEmails = (passenger) => passenger.contactInformation.reduce((list, value) => {
  if (!isEmail(value)) return list;
  return `${list}${emailTemplate(value)}`;
}, '');

const mapPhones = (passenger) => passenger.contactInformation.reduce((list, value) => {
  if (isEmail(value)) return list;
  return `${list}${phoneTemplate(value)}`;
}, '');

const mapContacList = (passengers) => Object.keys(passengers)
  .reduce((list, key, index) => {
    const passenger = passengers[key];
    return `${list}
      <iata:ContactInformation ContactID="CTC${index + 1}">
        ${mapEmails(passenger)}
        ${mapPhones(passenger)}
      </iata:ContactInformation>`;
  }, '');

  module.exports.orderCreateRequestTemplate_AF = data => `<soapenv:Envelope xmlns:iata="http://www.iata.org/IATA/EDIST/2017.1" xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  <soapenv:Header>
    <trackingMessageHeader xmlns="http://www.af-klm.com/soa/xsd/MessageHeader-V1_0">
      <consumerRef>
        <userID>w06014962</userID>
        <partyID>${data.Party.Participants.Participant.EnabledSystemParticipant.Name}</partyID>
        <consumerID>w06014962</consumerID>
        <consumerLocation>External</consumerLocation>
        <consumerType>A</consumerType>
        <consumerTime>${data.trackingMessageHeader.consumerRef.consumerTime}</consumerTime>
      </consumerRef>
    </trackingMessageHeader>
    <MessageID xmlns="http://www.w3.org/2005/08/addressing">b762bf9e-2487-42a3-bc88-be998364e51d</MessageID>
    <RelatesTo RelationshipType="InitiatedBy" xmlns="http://www.w3.org/2005/08/addressing">4b8a127d-a48f-4893-8530-90d665ff666c</RelatesTo>
    <RelatesTo RelationshipType="PrecededBy" xmlns="http://www.w3.org/2005/08/addressing">9cb0c7f1-04d8-4fbb-85a0-f682fff3693e</RelatesTo>
  </soapenv:Header>
  <soapenv:Body>
    <iata:OrderCreateRQ CorrelationID="correlationId" Version="17.1">
        <iata:Document/>
        <iata:Party>
          <iata:Sender>
              <iata:TravelAgencySender>
                <iata:Name>${data.Party.Sender.TravelAgencySender.Name}</iata:Name>
                <iata:PseudoCity>${data.Party.Sender.TravelAgencySender.PseudoCity}</iata:PseudoCity>
                <iata:IATA_Number>${data.Party.Sender.TravelAgencySender.IATA_Number}</iata:IATA_Number>
                <iata:AgencyID>${data.Party.Sender.TravelAgencySender.AgencyID}</iata:AgencyID>
                <iata:AgentUser>
                    <iata:AgentUserID>${data.Party.Sender.TravelAgencySender.AgentUser.AgentUserID}</iata:AgentUserID>
                </iata:AgentUser>
              </iata:TravelAgencySender>
          </iata:Sender>
              <iata:Participants>
                  <iata:Participant>
                      <iata:EnabledSystemParticipant SequenceNumber="${data.Party.Participants.Participant.EnabledSystemParticipant.SequenceNumber}">
                          <iata:Name>${data.Party.Participants.Participant.EnabledSystemParticipant.Name}</iata:Name>
                          <iata:SystemID>${data.Party.Participants.Participant.EnabledSystemParticipant.SystemID}</iata:SystemID>
                      </iata:EnabledSystemParticipant>
                  </iata:Participant>
              </iata:Participants>
          <iata:Recipient>
              <iata:ORA_Recipient>
                <iata:AirlineID>${data.Party.Participants.Participant.Recipient.ORA_Recipient.AirlineID}</iata:AirlineID>
                <iata:Name>${data.Party.Participants.Participant.Recipient.ORA_Recipient.Name}</iata:Name>
              </iata:ORA_Recipient>
          </iata:Recipient>
        </iata:Party>
        <iata:Query>
          <iata:Passengers/>
          <iata:Order>
              <iata:Offer OfferID="${data.Query.Order.Offer.OfferId}" Owner="${data.Query.Order.Offer.Owner}" ResponseID="correlationId">
                ${mapOfferItems(data.Query.Order.Offer.OfferItems)}
              </iata:Offer>
          </iata:Order>
          <iata:DataLists>
              <iata:PassengerList>
                ${mapPassengerList(data.Query.DataList.passengers)}
              </iata:PassengerList>
              <iata:ContactList>
                ${mapContacList(data.Query.DataList.passengers)}
              </iata:ContactList>
          </iata:DataLists>
        </iata:Query>
    </iata:OrderCreateRQ>
  </soapenv:Body>
</soapenv:Envelope>`;

module.exports.orderCreateRequestTemplate_AC = (headerData, data) => `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:v2="http://sita.aero/NDC/NDCUtility/v2">
<soapenv:Header/>
<soapenv:Body>
  <v2:NDCMSG_Envelope>
      <NDCMSG_Header>
        ${convertObjectToXML(headerData).join('')}
      </NDCMSG_Header>
      <NDCMSG_Body>
          <NDCMSG_Payload>
            <OrderCreateRQ Version="2017.2" PrimaryLangID="EN" xmlns="http://www.iata.org/IATA/EDIST/2017.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation=" ">
              ${convertObjectToXML(data).join('')}
            </OrderCreateRQ>
          </NDCMSG_Payload>
      </NDCMSG_Body>
  </v2:NDCMSG_Envelope>
</soapenv:Body>
</soapenv:Envelope>`;
