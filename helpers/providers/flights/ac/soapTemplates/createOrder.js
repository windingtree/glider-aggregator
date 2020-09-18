const { convertObjectToXML } = require('../../../../soapTemplates/utils/xmlUtils');

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
