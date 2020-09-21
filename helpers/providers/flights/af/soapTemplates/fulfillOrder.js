
const mapOrderItemsId = (ids) => ids.reduce((list, id) => `${list}
   <edis:OrderItemID Owner="AF">${id}</edis:OrderItemID>`, '');

const mapPassengerList = (passengers) => passengers.reduce((list, passenger) => `${list}
   <edis:Passenger PassengerID="${passenger}"/>`, '');


module.exports.fulfillOrderTemplate_AF = data => `<soapenv:Envelope xmlns:edis="http://www.iata.org/IATA/EDIST/2017.1" xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
<soapenv:Header>
      <trackingMessageHeader xmlns="http://www.af-klm.com/soa/xsd/MessageHeader-V1_0">
   <consumerRef>
     <userID>w06014962</userID>
     <partyID>${data.Party.Participants.Participant.EnabledSystemParticipant.Name}</partyID>
     <consumerID>w06014962</consumerID>
     <consumerLocation>External</consumerLocation>
     <consumerType>A</consumerType>
     <consumerTime>${data.requestTime}</consumerTime>
   </consumerRef>
 </trackingMessageHeader>
   <MessageID xmlns="http://www.w3.org/2005/08/addressing">b762bf9e-2487-42a3-bc88-be998364e51d</MessageID>
   <RelatesTo RelationshipType="InitiatedBy" xmlns="http://www.w3.org/2005/08/addressing">4b8a127d-a48f-4893-8530-90d665ff666c</RelatesTo>
   <RelatesTo RelationshipType="PrecededBy" xmlns="http://www.w3.org/2005/08/addressing">9cb0c7f1-04d8-4fbb-85a0-f682fff3693e</RelatesTo>
</soapenv:Header>
<soapenv:Body>
   <edis:AirDocIssueRQ CorrelationID="NDC-TEST-ISSUE-0205" Version="17.1">
      <edis:PointOfSale>
         <edis:Location>
            <edis:CountryCode>FR</edis:CountryCode>
         </edis:Location>
         <edis:RequestTime>${data.requestTime}</edis:RequestTime>
      </edis:PointOfSale>
      <edis:Document/>
      <edis:Party>
   <edis:Sender>
            <edis:TravelAgencySender>
               <edis:Name>${data.Party.Sender.TravelAgencySender.Name}</edis:Name>
               <edis:Contacts>
                  <edis:Contact>
                     <edis:EmailContact>
                        <edis:Address>becorniglion@airfrance.fr</edis:Address>
                     </edis:EmailContact>
                     <edis:PhoneContact>
                        <edis:Number>010230645</edis:Number>
                     </edis:PhoneContact>
                  </edis:Contact>
               </edis:Contacts>
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
      <edis:Query>
         <edis:TicketDocQuantity>1</edis:TicketDocQuantity>
         <edis:TicketDocInfo>
            <edis:PassengerReferences>${data.Query.DataLists.PassengerList.join(' ')}</edis:PassengerReferences>
            <edis:OrderReference>
               <edis:OrderID Owner="${data.Query.TicketDocInfo.OrderReference.OrderID.Owner}">${data.Query.TicketDocInfo.OrderReference.OrderID.id}</edis:OrderID>
               ${mapOrderItemsId(data.Query.TicketDocInfo.OrderReference.OrderItemIDs)}
            </edis:OrderReference>
            <edis:Payments>
               <edis:Payment>
                  <edis:Type>2</edis:Type>
               </edis:Payment>
            </edis:Payments>
         </edis:TicketDocInfo>
         <edis:DataLists>
            <edis:PassengerList>
               ${mapPassengerList(data.Query.DataLists.PassengerList)}
            </edis:PassengerList>
         </edis:DataLists>
      </edis:Query>
   </edis:AirDocIssueRQ>
</soapenv:Body>
</soapenv:Envelope>
`;
