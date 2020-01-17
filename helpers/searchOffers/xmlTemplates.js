// For documentation, https://github.com/windingtree/simard-schemas/blob/master/ndc/data-mapping.mds
const provideAirShoppingRequestTemplate = (data) => `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:edis="http://www.iata.org/IATA/EDIST/2017.1">
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
              <edis:OriginDestination>
                <edis:Departure>
                    <edis:AirportCode>${data.CoreQuery.OriginDestinations.OriginDestination.Departure.AirportCode}</edis:AirportCode>
                    <edis:Date>${data.CoreQuery.OriginDestinations.OriginDestination.Departure.Date}</edis:Date>
                </edis:Departure>
                <edis:Arrival>
                    <edis:AirportCode>${data.CoreQuery.OriginDestinations.OriginDestination.Arrival.AirportCode}</edis:AirportCode>
                </edis:Arrival>
              </edis:OriginDestination>
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
              <edis:Passenger>
                <edis:PTC>${data.CoreQuery.DataLists.PassengerList.Passenger.PTC}</edis:PTC>
              </edis:Passenger>
          </edis:PassengerList>
        </edis:DataLists>
    </edis:AirShoppingRQ>
  </soapenv:Body>
</soapenv:Envelope>`;

module.exports = {
  provideAirShoppingRequestTemplate,
};
