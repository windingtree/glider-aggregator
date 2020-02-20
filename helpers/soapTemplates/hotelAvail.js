
const mapGuestCounts = (guests) => guests
	.reduce((guestCounts, {AgeQualifyingCode, Count}) => `${guestCounts}
		<GuestCount AgeQualifyingCode="${AgeQualifyingCode}" Count="${Count}"/>`
	, '')

const mapCriterions = (HotelSearchCriteria, {isDeepLinkRequired, isContentRequired, isCancellationPolicyRequired}) => HotelSearchCriteria
	.reduce((criterions, {HotelRef}) => `${criterions}
	<Criterion>
		<StayDateRange Duration="${HotelRef.StayDateRange.Duration}" Start="${HotelRef.StayDateRange.Start}"/>
		<RoomStayCandidates>
			<RoomStayCandidate Quantity="${HotelRef.StayDateRange.RoomStayCandidates.RoomStayCandidate.Quantity}">
				<GuestCounts>
					${mapGuestCounts(HotelRef.StayDateRange.RoomStayCandidates.RoomStayCandidate.GuestCounts)}
				</GuestCounts>
			</RoomStayCandidate>
		</RoomStayCandidates>
		<HotelRef HotelCode="${HotelRef.HotelCode}"/>
		<TPA_Extensions>
			<isDeepLinkRequired DeepLinkType="${isDeepLinkRequired.DeepLinkType}" isDeepLinkRequired="${isDeepLinkRequired.isDeepLinkRequired}"/>
			<isContentRequired isAmenityRequired="${isContentRequired.isAmenityRequired}" isContentRequired="${isContentRequired.isContentRequired}"/>
			<isCancellationPolicyRequired CancellationPolicyRequired="${isCancellationPolicyRequired.isCancellationPolicyRequired}"/>
		</TPA_Extensions>
	</Criterion>
	`, '');


const hotelAvailRequestTemplate = ({OTA_HotelAvailRQ}) => `
<?xml version="1.0" ?>
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">
	<SOAP-ENV:Header xmlns:wsa="http://www.w3.org/2005/08/addressing">
		<wsse:Security SOAP-ENV:mustunderstand="1" xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
			<wsse:UsernameToken xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd"/>
		</wsse:Security>
		<wsa:Action>http://www.opentravel.org/OTA/2003/05/getOTAHotelAvailability</wsa:Action>
		<wsa:MessageID>uuid:91a83ac1-8931-4618-ab49-692a25fa5a17</wsa:MessageID>
	</SOAP-ENV:Header>
	<SOAP-ENV:Body>
		<OTA_HotelAvailRQ AvailRatesOnly="${OTA_HotelAvailRQ.AvailRatesOnly}" EchoToken="TestPullWT1234" PrimaryLangID="${OTA_HotelAvailRQ.PrimaryLangID}" RequestedCurrency="${OTA_HotelAvailRQ.RequestedCurrency}" TimeStamp="${OTA_HotelAvailRQ.TimeStamp}" Version="${OTA_HotelAvailRQ.Version}" xmlns="${OTA_HotelAvailRQ.xmlns}">
			<POS>
				<Source>
					<RequestorID ID="${OTA_HotelAvailRQ.POS.Source.RequestorID.ID}" MessagePassword="${OTA_HotelAvailRQ.POS.Source.RequestorID.MessagePassword}" Name="${OTA_HotelAvailRQ.POS.Source.RequestorID.Name}" Type="${OTA_HotelAvailRQ.POS.Source.RequestorID.Type}"/>
					<BookingChannel Primary="${OTA_HotelAvailRQ.POS.Source.BookingChannel.Primary}" Type="${OTA_HotelAvailRQ.POS.Source.BookingChannel.Type}">
						<CompanyName Code="${OTA_HotelAvailRQ.POS.Source.BookingChannel.CompanyName.Code}">${OTA_HotelAvailRQ.POS.Source.BookingChannel.CompanyName.name}</CompanyName>
					</BookingChannel>
				</Source>
			</POS>
			<AvailRequestSegments>
				<AvailRequestSegment AvailReqType="${OTA_HotelAvailRQ.AvailRequestSegments.AvailRequestSegment.AvailReqType}">
					<HotelSearchCriteria>
					 ${mapCriterions(OTA_HotelAvailRQ.AvailRequestSegments.AvailRequestSegment.HotelSearchCriteria, OTA_HotelAvailRQ.TPA_Extensions)}
					</HotelSearchCriteria>
				</AvailRequestSegment>
			</AvailRequestSegments>
		</OTA_HotelAvailRQ>
	</SOAP-ENV:Body>
</SOAP-ENV:Envelope>`.trim();

module.exports = {
  hotelAvailRequestTemplate,
}