const {
  mapGuestCount,
  mapGuestCounts,
  mapRate,
  mapRates,
  mapRoomRate,
  mapPaymentCard,
  mapGuarantee,
  // mapRoomStay,
  // mapPOS,
  // mapAddress,
  // mapPersonName,
  // mapProfile,
  // mapResGuest,
  // mapHotelReservationID,
  // mapHotelReservation,
  // mapHotelResNotif,
  // mapSoapHeader,
  // mapHotelResNotifSoap
} = require('../../helpers/soapTemplates/ota/otaHotelResNotifRQ');
const {
  mapGuestCounts: mapGuestCountsHotelAvail,
  mapCriterions,
  hotelAvailRequestTemplate
} = require('../../helpers/soapTemplates/ota/otaHotelAvailRQ');
const {
  seatAvailabilityRequestTemplate_AC
} = require('../../helpers/soapTemplates/seatAvailability');
const seatmapJson = require('../mocks/seatmap.json');
const {
  provideShoppingRequestTemplate_AC
} = require('../../helpers/soapTemplates/searchOffers');
const searchFlightsJson = require('../mocks/searchFlightOffers.json');

require('chai').should();

describe('soapTemplates', () => {
  // const ageCodes = [10, 8];

  describe('otaHotelResNotifRQ', () => {
    const OTA_GuestCount = {
      Count: 1,
      AgeQualifyingCode: 10
    };
    const OTA_Rate = {
      EffectiveDate: '2020-07-02',
      ExpireDate: '2020-07-03',
      RateTimeUnit: 'Day',
      UnitMultiplier: '0.0',
      Base: {
        AmountAfterTax: '776.0',
        CurrencyCode: 'SEK'
      }
    };
    const OTA_RoomRate = {
      NumberOfUnits: 2,
      RatePlanCode: 'LSAVE',
      RoomTypeCode: 'ND1',
      Rates: [
        OTA_Rate,
        OTA_Rate
      ]
    };
    const OTA_PaymentCard = {
      CardType: '1',
      CardCode: 'VI',
      CardNumber: '4444333322221111',
      ExpireDate: '1024',
      CardHolderName: 'TEST',
      SeriesCode: '111'
    };
    const OTA_Guarantee = {
      GuaranteeType: 'GuaranteeRequired',
      GuaranteeCode: 'GCC',
      PaymentCard: OTA_PaymentCard,
      GuaranteeDescription: 'Credit Card Guarantee'
    };

    describe('#mapGuestCount', () => {

      it('should map data', async () => {
        const result = mapGuestCount(OTA_GuestCount);
        (result).should.equal('<GuestCount AgeQualifyingCode="10" Count="1"/>');
      });

      it('should return empty string if count equal to 0', async () => {
        const result = mapGuestCount({
          Count: 0
        });
        (result).should.equal('');
      });
    });

    describe('#mapGuestCounts', () => {

      it('should map data', async () => {
        const result = mapGuestCounts([
          OTA_GuestCount,
          OTA_GuestCount
        ]);
        (result).should.equal('<GuestCounts IsPerRoom="false">\n  <GuestCount AgeQualifyingCode="10" Count="1"/><GuestCount AgeQualifyingCode="10" Count="1"/>\n</GuestCounts>');
      });
    });

    describe('#mapRate', () => {

      it('should map data', async () => {
        const result = mapRate(OTA_Rate);
        (result).should.equal('<Rate\n  EffectiveDate="2020-07-02"\n  ExpireDate="2020-07-03"\n  RateTimeUnit="Day"\n  UnitMultiplier="0.0"\n>\n  <Base\n      AmountAfterTax="776.0"\n      CurrencyCode="SEK"\n  />\n</Rate>');
      });
    });

    describe('#mapRates', () => {

      it('should map data', async () => {
        const result = mapRates([
          OTA_Rate,
          OTA_Rate
        ]);
        (result).should.equal('<Rates>\n  <Rate\n  EffectiveDate="2020-07-02"\n  ExpireDate="2020-07-03"\n  RateTimeUnit="Day"\n  UnitMultiplier="0.0"\n>\n  <Base\n      AmountAfterTax="776.0"\n      CurrencyCode="SEK"\n  />\n</Rate><Rate\n  EffectiveDate="2020-07-02"\n  ExpireDate="2020-07-03"\n  RateTimeUnit="Day"\n  UnitMultiplier="0.0"\n>\n  <Base\n      AmountAfterTax="776.0"\n      CurrencyCode="SEK"\n  />\n</Rate>\n</Rates>');
      });
    });

    describe('#mapRoomRate', () => {

      it('should map data', async () => {
        const result = mapRoomRate(OTA_RoomRate);
        (result).should.equal('<RoomRate\n  NumberOfUnits="2"\n  RatePlanCode="LSAVE"\n  RoomTypeCode="ND1"\n>\n  <Rates>\n  <Rate\n  EffectiveDate="2020-07-02"\n  ExpireDate="2020-07-03"\n  RateTimeUnit="Day"\n  UnitMultiplier="0.0"\n>\n  <Base\n      AmountAfterTax="776.0"\n      CurrencyCode="SEK"\n  />\n</Rate><Rate\n  EffectiveDate="2020-07-02"\n  ExpireDate="2020-07-03"\n  RateTimeUnit="Day"\n  UnitMultiplier="0.0"\n>\n  <Base\n      AmountAfterTax="776.0"\n      CurrencyCode="SEK"\n  />\n</Rate>\n</Rates>\n</RoomRate>');
      });
    });

    describe('#mapPaymentCard', () => {

      it('should map data', async () => {
        const result = mapPaymentCard(OTA_PaymentCard);
        (result).should.equal('<PaymentCard CardCode="VI" CardNumber="4444333322221111" CardType="1" ExpireDate="1024" SeriesCode="111"><CardHolderName>TEST</CardHolderName></PaymentCard>');
      });
    });

    describe('#mapGuarantee', () => {

      it('should map data', async () => {
        const result = mapGuarantee(OTA_Guarantee);
        (result).should.equal('<Guarantee\n  GuaranteeType="GuaranteeRequired"\n  GuaranteeCode="GCC"\n>\n  <GuaranteesAccepted>\n      <GuaranteeAccepted><PaymentCard CardCode="VI" CardNumber="4444333322221111" CardType="1" ExpireDate="1024" SeriesCode="111"><CardHolderName>TEST</CardHolderName></PaymentCard></GuaranteeAccepted>\n  </GuaranteesAccepted>\n  <GuaranteeDescription>\n      <Text>Credit Card Guarantee</Text>\n  </GuaranteeDescription>\n</Guarantee>');
      });
    });
  });

  describe('otaHotelAvailRQ', () => {
    const guestCounts = [
      {
        AgeQualifyingCode: 10,
        Count: 2
      },
      {
        AgeQualifyingCode: 8,
        Count: 1
      }
    ];
    const hotelSearchCriteria = [
      {
        HotelRef: {
          HotelCode: '02034',
          StayDateRange: {
            Start: '2020-09-02',
            Duration: 1,
            RoomStayCandidates: {
              RoomStayCandidate: {
                Quantity: 3,
                GuestCounts: guestCounts
              }
            }
          }
        }
      }
    ];
    const tpaExtensions = {
      isDeepLinkRequired: {
        DeepLinkType: 'URL',
        isDeepLinkRequired: true
      },
      isContentRequired: {
        isAmenityRequired: true,
        isContentRequired: true
      },
      isCancellationPolicyRequired: {
        isCancellationPolicyRequired: true
      }
    };
    const hotelAvailRequest = {
      OTA_HotelAvailRQ: {
        AvailRatesOnly: true,
        PrimaryLangID: 'EN',
        RequestedCurrency: 'USD',
        TimeStamp: '1980-03-21T00:00:00Z',
        Version: '1.1',
        xmlns: 'http://www.domain.com/soa/xsd/MessageHeader-V1_0',
        POS: {
          Source: {
            RequestorID: {
              ID: '17',
              MessagePassword: 'Windingtree',
              Name: 'Windingtree',
              Type: '13',
            },
            BookingChannel: {
              Primary: 'true',
              Type: '2',
              CompanyName: {
                name: 'Windingtree',
                Code: '245800'
              }
            }
          }
        },
        AvailRequestSegments: {
          AvailRequestSegment: {
            AvailReqType: 'Both',
            HotelSearchCriteria: hotelSearchCriteria,
          }
        },
        TPA_Extensions: tpaExtensions
      }
    };

    describe('#mapGuestCounts', () => {

      it('should produce broken xml data if wrong count object has been provided', async () => {
        const wrongGuestCounts1 = [
          {
            Count: 2
          }
        ];
        const wrongGuestCounts2 = [
          {
            AgeQualifyingCode: 10
          }
        ];
        let result = mapGuestCountsHotelAvail(wrongGuestCounts1);
        (result).should.equal('\n      <GuestCount AgeQualifyingCode="undefined" Count="2"/>');
        result = mapGuestCountsHotelAvail(wrongGuestCounts2);
        (result).should.equal('\n      <GuestCount AgeQualifyingCode="10" Count="undefined"/>');
      });

      it('should map query to xml data', async () => {
        const result = mapGuestCountsHotelAvail(guestCounts);
        (result).should.equal('\n      <GuestCount AgeQualifyingCode="10" Count="2"/>\n      <GuestCount AgeQualifyingCode="8" Count="1"/>');
      });
    });

    describe('#mapCriterions', () => {

      it('should map query to xml data', async () => {
        const result = mapCriterions(hotelSearchCriteria, tpaExtensions);
        (result).should.equal('\n    <Criterion>\n        <StayDateRange Duration="1" Start="2020-09-02"/>\n        <RoomStayCandidates>\n            <RoomStayCandidate Quantity="3">\n                <GuestCounts>\n                    \n      <GuestCount AgeQualifyingCode="10" Count="2"/>\n      <GuestCount AgeQualifyingCode="8" Count="1"/>\n                </GuestCounts>\n            </RoomStayCandidate>\n        </RoomStayCandidates>\n        <HotelRef HotelCode="02034"/>\n        <TPA_Extensions>\n            <isDeepLinkRequired DeepLinkType="URL" isDeepLinkRequired="true"/>\n            <isContentRequired isAmenityRequired="true" isContentRequired="true"/>\n            <isCancellationPolicyRequired CancellationPolicyRequired="true"/>\n        </TPA_Extensions>\n    </Criterion>');
      });
    });

    describe('#hotelAvailRequestTemplate', () => {

      it('should map query to xml data', async () => {
        const result = hotelAvailRequestTemplate(hotelAvailRequest);
        (result).should.equal('<?xml version="1.0" ?>\n<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">\n<SOAP-ENV:Header xmlns:wsa="http://www.w3.org/2005/08/addressing">\n    <wsse:Security SOAP-ENV:mustunderstand="1" xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">\n        <wsse:UsernameToken xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd"/>\n    </wsse:Security>\n    <wsa:Action>http://www.opentravel.org/OTA/2003/05/getOTAHotelAvailability</wsa:Action>\n    <wsa:MessageID>uuid:91a83ac1-8931-4618-ab49-692a25fa5a17</wsa:MessageID>\n</SOAP-ENV:Header>\n<SOAP-ENV:Body>\n    <OTA_HotelAvailRQ AvailRatesOnly="true" EchoToken="TestPullWT1234" PrimaryLangID="EN" RequestedCurrency="USD" TimeStamp="1980-03-21T00:00:00Z" Version="1.1" xmlns="http://www.domain.com/soa/xsd/MessageHeader-V1_0">\n        <POS>\n            <Source>\n                <RequestorID ID="17" MessagePassword="Windingtree" Name="Windingtree" Type="13"/>\n                <BookingChannel Primary="true" Type="2">\n                    <CompanyName Code="245800">Windingtree</CompanyName>\n                </BookingChannel>\n            </Source>\n        </POS>\n        <AvailRequestSegments>\n            <AvailRequestSegment AvailReqType="Both">\n                <HotelSearchCriteria>\n                 \n    <Criterion>\n        <StayDateRange Duration="1" Start="2020-09-02"/>\n        <RoomStayCandidates>\n            <RoomStayCandidate Quantity="3">\n                <GuestCounts>\n                    \n      <GuestCount AgeQualifyingCode="10" Count="2"/>\n      <GuestCount AgeQualifyingCode="8" Count="1"/>\n                </GuestCounts>\n            </RoomStayCandidate>\n        </RoomStayCandidates>\n        <HotelRef HotelCode="02034"/>\n        <TPA_Extensions>\n            <isDeepLinkRequired DeepLinkType="URL" isDeepLinkRequired="true"/>\n            <isContentRequired isAmenityRequired="true" isContentRequired="true"/>\n            <isCancellationPolicyRequired CancellationPolicyRequired="true"/>\n        </TPA_Extensions>\n    </Criterion>\n                </HotelSearchCriteria>\n            </AvailRequestSegment>\n        </AvailRequestSegments>\n    </OTA_HotelAvailRQ>\n</SOAP-ENV:Body>\n</SOAP-ENV:Envelope>');
      });
    });
  });

  describe('seatAvailability', () => {

    describe('#seatAvailabilityRequestTemplate_AC', () => {
      const result = seatAvailabilityRequestTemplate_AC(seatmapJson);
      (result).should.equal('<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:v2="http://sita.aero/NDC/NDCUtility/v2">\n<soapenv:Header/>\n<soapenv:Body>\n  <v2:NDCMSG_Envelope>\n    <NDCMSG_Header>\n      <Function>SeatAvailabilityRQ</Function>\n      <SchemaType>NDC</SchemaType>\n      <SchemaVersion>YY.2017.2</SchemaVersion>\n      <RichMedia>true</RichMedia>\n      <Sender>\n        <Address>\n          <Company>WindingTree</Company>\n          <NDCSystemId>DEV</NDCSystemId>\n        </Address>\n      </Sender>\n      <Recipient>\n        <Address>\n          <Company>AC</Company>\n          <NDCSystemId>DEV</NDCSystemId>\n        </Address>\n      </Recipient>\n    </NDCMSG_Header>\n    <NDCMSG_Body>\n      <NDCMSG_Payload>\n        <SeatAvailabilityRQ Version="2017.2" xmlns="http://www.iata.org/IATA/EDIST/2017.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n            <PointOfSale><Location><CountryCode>CA</CountryCode></Location><TouchPoint><Device><Code>0.AAA.X</Code><TableName /></Device></TouchPoint></PointOfSale><Party><Participants><Participant><EnabledSystemParticipant SequenceNumber="1"><Name>WindingTreePOSCA</Name><Category>DC</Category><SystemID Owner="ADS">mcmEL4qB</SystemID></EnabledSystemParticipant></Participant></Participants></Party><Document id="OneWay"><Name>NDC-Exchange</Name><ReferenceVersion>UAT-OTA-2010B</ReferenceVersion></Document><Query><Offer Owner="AC" OfferID="HOT4YXITL4-OfferID-1" ResponseID=""><PassengerID>B1E9EC6A</PassengerID><SegmentID>Z6AG2A6ZJL-SEG1</SegmentID><SegmentID>TY7A1U7AIM-SEG2</SegmentID></Offer></Query><DataLists><PassengerList><Passenger PassengerID="B1E9EC6A"><PTC>ADT</PTC></Passenger></PassengerList><FlightSegmentList><FlightSegment SegmentKey="Z6AG2A6ZJL-SEG1" refs="M5E6W3S3VY-OD1"><Departure><AirportCode>YYC</AirportCode><Date>2020-09-14</Date><Time>07:00</Time></Departure><Arrival><AirportCode>YYZ</AirportCode><Date>2020-09-14</Date><Time>12:50</Time><Terminal><Name>1</Name></Terminal></Arrival><MarketingCarrier><AirlineID>AC</AirlineID><Name>Air Canada</Name><FlightNumber>134</FlightNumber><ResBookDesigCode>T</ResBookDesigCode></MarketingCarrier><OperatingCarrier><Disclosures><Description><Text>pJyAxvTLWDVvF8SySYd5TW2hGD96yqr9UnlLUkThnLG/17BjuAKyJQLIS8+5KZ+nWZ+eCqjGklc8V50L+k74WbqNq9ZO3IpGls6u+xccVld4Gup4vlJ+Oye7VT9dQMN4k79o+QVRFEynPWYDs9X8BA==</Text></Description></Disclosures></OperatingCarrier><Equipment><AircraftCode>7M8</AircraftCode></Equipment><ClassOfService><Code>T</Code></ClassOfService><FlightDetail><FlightDuration><Value /></FlightDuration><Stops><StopQuantity>0</StopQuantity></Stops></FlightDetail></FlightSegment><FlightSegment SegmentKey="TY7A1U7AIM-SEG2" refs="M5E6W3S3VY-OD1"><Departure><AirportCode>YYZ</AirportCode><Date>2020-09-14</Date><Time>14:50</Time><Terminal><Name>1</Name></Terminal></Departure><Arrival><AirportCode>YYT</AirportCode><Date>2020-09-14</Date><Time>19:19</Time></Arrival><MarketingCarrier><AirlineID>AC</AirlineID><Name>Air Canada</Name><FlightNumber>1544</FlightNumber><ResBookDesigCode>T</ResBookDesigCode></MarketingCarrier><OperatingCarrier><Disclosures><Description><Text>pJyAxvTLWDVvF8SySYd5TV8dpcsYUV67DAplC3QvK8JCV20YIAxokyvip2BMSJ7daGtED8EIJYrlpn8XB8pRX6r+QhxHHDS4OduCOeU5xip/veYLBfhQ9w==</Text></Description></Disclosures></OperatingCarrier><Equipment><AircraftCode>321</AircraftCode></Equipment><ClassOfService><Code>T</Code></ClassOfService><FlightDetail><FlightDuration><Value /></FlightDuration><Stops><StopQuantity>0</StopQuantity></Stops></FlightDetail></FlightSegment></FlightSegmentList></DataLists>\n        </SeatAvailabilityRQ>\n      </NDCMSG_Payload>\n    </NDCMSG_Body>\n  </v2:NDCMSG_Envelope>\n</soapenv:Body>\n</soapenv:Envelope>');
    });
  });

  describe('searchOffers', () => {

    describe('#provideShoppingRequestTemplate_AC', () => {
      const result = provideShoppingRequestTemplate_AC(searchFlightsJson);
      (result).should.equal('<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:v2="http://sita.aero/NDC/NDCUtility/v2">\n<soapenv:Header/>\n<soapenv:Body>\n  <v2:NDCMSG_Envelope>\n      <NDCMSG_Header>\n          <Function>AirShoppingRQ</Function>\n          <SchemaType>NDC</SchemaType>\n          <SchemaVersion>YY.2017.2</SchemaVersion>\n          <RichMedia>true</RichMedia>\n          <Sender>\n            <Address>\n                <Company>WindingTree</Company>\n                <NDCSystemId>DEV</NDCSystemId>\n            </Address>\n          </Sender>\n          <Recipient>\n            <Address>\n              <Company>AC</Company>\n              <NDCSystemId>DEV</NDCSystemId>\n            </Address>\n          </Recipient>\n      </NDCMSG_Header>\n      <NDCMSG_Body>\n          <NDCMSG_Payload>\n            <AirShoppingRQ Version="2017.2" xmlns="http://www.iata.org/IATA/EDIST/2017.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n              <PointOfSale><Location><CountryCode>CA</CountryCode></Location><TouchPoint><Device><Code>0.AAA.X</Code><TableName /></Device></TouchPoint></PointOfSale><Party><Participants><Participant><EnabledSystemParticipant SequenceNumber="1"><Name>WindingTreePOSCA</Name><Category>DC</Category><SystemID Owner="ADS">mcmEL4qB</SystemID></EnabledSystemParticipant></Participant></Participants></Party><Document id="OneWay"><Name>NDC-Exchange</Name><ReferenceVersion>UAT-OTA-2010B</ReferenceVersion></Document><CoreQuery><OriginDestinations><OriginDestination><Departure><AirportCode>YYC</AirportCode><Date>2020-09-14</Date><Time>03:00</Time></Departure><Arrival><AirportCode>YYT</AirportCode></Arrival></OriginDestination></OriginDestinations></CoreQuery><DataLists><PassengerList><Passenger><PTC>ADT</PTC></Passenger></PassengerList></DataLists>\n            </AirShoppingRQ>\n          </NDCMSG_Payload>\n      </NDCMSG_Body>\n  </v2:NDCMSG_Envelope>\n</soapenv:Body>\n</soapenv:Envelope>');
    });
  });
});
