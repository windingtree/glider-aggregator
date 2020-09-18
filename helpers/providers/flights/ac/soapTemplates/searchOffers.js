const { convertObjectToXML, getACSystemId } = require('../../../../soapTemplates/utils/xmlUtils');
// For documentation, https://github.com/windingtree/simard-schemas/blob/master/ndc/data-mapping.mds

module.exports.provideShoppingRequestTemplate_AC = data => `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:v2="http://sita.aero/NDC/NDCUtility/v2">
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
                <NDCSystemId>${getACSystemId(false)}</NDCSystemId>
            </Address>
          </Sender>
          <Recipient>
            <Address>
              <Company>AC</Company>
              <NDCSystemId>${getACSystemId(false)}</NDCSystemId>
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
