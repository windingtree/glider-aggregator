const { convertObjectToXML } = require('./utils/xmlUtils');

module.exports.offerPriceRequestTemplate_AC = data => `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:v2="http://sita.aero/NDC/NDCUtility/v2">
<soapenv:Header/>
<soapenv:Body>
  <v2:NDCMSG_Envelope>
    <NDCMSG_Header>
      <Function>OfferPriceRQ</Function>
      <SchemaType>NDC</SchemaType>
      <SchemaVersion>YY.2017.2</SchemaVersion>
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
        <OfferPriceRQ Version="2017.2" xmlns="http://www.iata.org/IATA/EDIST/2017.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" PrimaryLangID="EN">
            ${convertObjectToXML(data).join('')}
        </OfferPriceRQ>
      </NDCMSG_Payload>
    </NDCMSG_Body>
  </v2:NDCMSG_Envelope>
</soapenv:Body>
</soapenv:Envelope>`;
