const { v4: uuidv4 } = require('uuid');

/* Mapping for Guest Counts */
const mapGuestCount = OTA_GuestCount => {
  if (OTA_GuestCount.Count === 0) {
    return '';
  };
  let guestCount = '';
  guestCount += ` AgeQualifyingCode="${OTA_GuestCount.AgeQualifyingCode}"`;
  guestCount += ` Count="${OTA_GuestCount.Count}"`;
  return `<GuestCount${guestCount}/>`;
};

const mapGuestCounts = OTA_GuestCounts => `
<GuestCounts IsPerRoom="false">
  ${OTA_GuestCounts.reduce((guestCounts, guestCount) => guestCounts + mapGuestCount(guestCount), '')}
</GuestCounts>
`.trim();

/* Mapping for Rates */
const mapRate = OTA_Rate => `
<Rate
  EffectiveDate="${OTA_Rate.EffectiveDate}"
  ExpireDate="${OTA_Rate.ExpireDate}"
  RateTimeUnit="${OTA_Rate.RateTimeUnit}"
  UnitMultiplier="${OTA_Rate.UnitMultiplier}"
>
  <Base
      AmountAfterTax="${OTA_Rate.Base.AmountAfterTax}"
      CurrencyCode="${OTA_Rate.Base.CurrencyCode}"
  />
</Rate>
`.trim();

const mapRates = OTA_Rates => `
<Rates>
  ${OTA_Rates.reduce((rates, rate) => rates + mapRate(rate), '')}
</Rates>
`.trim();

const mapRoomRate = OTA_RoomRate => `
<RoomRate
  NumberOfUnits="${OTA_RoomRate.NumberOfUnits}"
  RatePlanCode="${OTA_RoomRate.RatePlanCode}"
  RoomTypeCode="${OTA_RoomRate.RoomTypeCode}"
>
  ${mapRates(OTA_RoomRate.Rates)}
</RoomRate>
`.trim();

/* Mapping for Guarantee */
const mapPaymentCard = OTA_PaymentCard => {
  let paymentCard = '<PaymentCard';

  // Add Payment Card attributes
  paymentCard += ` CardCode="${OTA_PaymentCard.CardCode}"`;
  paymentCard += ` CardNumber="${OTA_PaymentCard.CardNumber}"`;
  paymentCard += ` CardType="${OTA_PaymentCard.CardType}"`;
  paymentCard += ` ExpireDate="${OTA_PaymentCard.ExpireDate}"`;

  if (OTA_PaymentCard.SeriesCode !== undefined) {
    paymentCard += ` SeriesCode="${OTA_PaymentCard.SeriesCode}"`;
  }
  paymentCard += '>';

  // Cardholder name is mandatory
  if (OTA_PaymentCard.CardHolderName !== undefined) {
    paymentCard += `<CardHolderName>${OTA_PaymentCard.CardHolderName}</CardHolderName>`;
  } else {
    paymentCard += '<CardHolderName/>';
  }

  // Finish the object
  paymentCard += '</PaymentCard>';

  return paymentCard;
};

const mapGuarantee = OTA_Guarantee => `
<Guarantee
  GuaranteeType="${OTA_Guarantee.GuaranteeType}"
  GuaranteeCode="${OTA_Guarantee.GuaranteeCode}"
>
  <GuaranteesAccepted>
      <GuaranteeAccepted>${mapPaymentCard(OTA_Guarantee.PaymentCard)}</GuaranteeAccepted>
  </GuaranteesAccepted>
  <GuaranteeDescription>
      <Text>${OTA_Guarantee.GuaranteeDescription}</Text>
  </GuaranteeDescription>
</Guarantee>
`.trim();

const mapRoomStay = OTA_RoomStay => `
<RoomStay>
  <RatePlans>
    <RatePlan RatePlanCode="${OTA_RoomStay.RatePlans.RatePlan.RatePlanCode}">
      <MealsIncluded
          MealPlanCodes=""
          MealPlanIndicator="false"
      />
    </RatePlan>
  </RatePlans>
  <RoomRates>
      ${mapRoomRate(OTA_RoomStay.RoomRates.RoomRate)}
  </RoomRates>
  ${mapGuestCounts(OTA_RoomStay.GuestCounts)}
  <TimeSpan
    Start="${OTA_RoomStay.TimeSpan.Start}"
    End="${OTA_RoomStay.TimeSpan.End}"
  />
  ${mapGuarantee(OTA_RoomStay.Guarantee)}
  <Total
    AmountAfterTax="${OTA_RoomStay.Total.AmountAfterTax}"
    CurrencyCode="${OTA_RoomStay.Total.CurrencyCode}">
    <Taxes Amount="${OTA_RoomStay.Total.Taxes.Amount}" CurrencyCode="${OTA_RoomStay.Total.CurrencyCode}">
      <Tax
        Type="Exclusive"
        Amount="${OTA_RoomStay.Total.Taxes.Amount}"
        CurrencyCode="${OTA_RoomStay.Total.CurrencyCode}"
      />
    </Taxes>
  </Total>
  <BasicPropertyInfo
      HotelCode="${OTA_RoomStay.BasicPropertyInfo.HotelCode}"/>
  <ResGuestRPHs>
      <ResGuestRPH
          RPH="${OTA_RoomStay.ResGuestRPHs.ResGuestRPH.RPH}"/>
  </ResGuestRPHs>
  <Comments>
      <Comment GuestViewable="0">
          <Text>Booked via Winding Tree</Text>
      </Comment>
  </Comments>
  <SpecialRequests>
      <SpecialRequest RequestCode="" CodeContext=""/>
  </SpecialRequests>
</RoomStay>
`.trim();

const mapPOS = OTA_POS => `
<POS>
  <Source>
    <RequestorID
      ID="${OTA_POS.Source.RequestorID.ID}"
      Type="${OTA_POS.Source.RequestorID.Type}"
    />
    <BookingChannel
      Primary="${OTA_POS.Source.BookingChannel.Primary}"
      Type="${OTA_POS.Source.BookingChannel.Type}"
    >
      <CompanyName Code="${OTA_POS.Source.BookingChannel.CompanyName.Code}">${OTA_POS.Source.BookingChannel.CompanyName.name}</CompanyName>
    </BookingChannel>
  </Source>
</POS>
`.trim();

const mapAddress = OTA_Address => {
  if (OTA_Address === undefined) {
    return '<Address Type="1"><AddressLine/><CityName/><PostalCode/><StateProv StateCode=""/><CountryName Code=""/></Address>';
  }
  return `
<Address Type="${OTA_Address.Type}">
    <AddressLine>${OTA_Address.AddressLines ? OTA_Address.AddressLines[0] : ''}</AddressLine>
    <AddressLine>${OTA_Address.AddressLines ? OTA_Address.AddressLines[1] : ''}</AddressLine>
    <CityName>${OTA_Address.CityName}</CityName>
    <PostalCode>${OTA_Address.PostalCode}</PostalCode>
    <StateProv>${OTA_Address.StateProv}</StateProv>
    <CountryName Code="${OTA_Address.CountryName.Code}"/>
</Address>
`.trim();
};

const mapPersonName = OTA_PersonName => {
  let personName = '';
  if (OTA_PersonName.NamePrefix !== undefined)
    personName += `<NamePrefix>${OTA_PersonName.NamePrefix}</NamePrefix>`;
  if (OTA_PersonName.GivenName !== undefined)
    personName += `<GivenName>${OTA_PersonName.GivenName}</GivenName>`;
  if (OTA_PersonName.MiddleName !== undefined)
    personName += `<MiddleName>${OTA_PersonName.MiddleName}</MiddleName>`;
  if (OTA_PersonName.Surname !== undefined)
    personName += `<Surname>${OTA_PersonName.Surname}</Surname>`;
  return `<PersonName>${personName}</PersonName>`.trim();
};

const mapProfile = OTA_Profile => `
<Profile
  ProfileType="${OTA_Profile.ProfileType}">
  <Customer>
    ${mapPersonName(OTA_Profile.Customer.PersonName)}
    <Telephone
        FormattedInd="${OTA_Profile.Customer.Telephone.FormattedInd}"
        PhoneNumber="${OTA_Profile.Customer.Telephone.PhoneNumber}"
        PhoneTechType="${OTA_Profile.Customer.Telephone.PhoneTechType}"/>
    <Email EmailType="${OTA_Profile.Customer.Email.EmailType}">${OTA_Profile.Customer.Email.email}</Email>
    ${mapAddress(OTA_Profile.Customer.Address)}
  </Customer>
  <CompanyInfo>
    <CompanyName>${OTA_Profile.CompanyInfo.CompanyName}</CompanyName>
  </CompanyInfo>
</Profile>
`.trim();

const mapResGuest = OTA_ResGuest => `
<ResGuest
  PrimaryIndicator="${OTA_ResGuest.PrimaryIndicator}"
  ResGuestRPH="${OTA_ResGuest.ResGuestRPH}">
  <Profiles>
    <ProfileInfo>
        ${mapProfile(OTA_ResGuest.Profiles.ProfileInfo.Profile)}
    </ProfileInfo>
  </Profiles>
</ResGuest>
`.trim();

const mapHotelReservationID = OTA_HotelReservationID => `
<HotelReservationID
  ResID_Source="${OTA_HotelReservationID.ResID_Source}"
  ResID_Type="${OTA_HotelReservationID.ResID_Type}"
  ResID_Value="${OTA_HotelReservationID.ResID_Value}"
/>
`.trim();

const mapHotelReservation = OTA_HotelReservation => `
<HotelReservation
  CreateDateTime="${OTA_HotelReservation.CreateDateTime}"
  CreatorID="${OTA_HotelReservation.CreatorID}"
  ResStatus="${OTA_HotelReservation.ResStatus}">
  <UniqueID
    ID="${OTA_HotelReservation.UniqueID.ID}"
    Type="${OTA_HotelReservation.UniqueID.Type}"
  />
  <RoomStays>
    ${mapRoomStay(OTA_HotelReservation.RoomStays.RoomStay)}
  </RoomStays>
  <ResGuests>
    ${mapResGuest(OTA_HotelReservation.ResGuests.ResGuest)}
  </ResGuests>
  <ResGlobalInfo>
    <HotelReservationIDs>
        ${mapHotelReservationID(OTA_HotelReservation.ResGlobalInfo.HotelReservationIDs.HotelReservationID)}
    </HotelReservationIDs>
  </ResGlobalInfo>
</HotelReservation>
`.trim();

const mapHotelResNotif = OTA_HotelResNotifRQ => `
<OTA_HotelResNotifRQ
  EchoToken="${OTA_HotelResNotifRQ.EchoToken}"
  ResStatus="${OTA_HotelResNotifRQ.ResStatus}"
  Target="Production"
  TimeStamp="${OTA_HotelResNotifRQ.TimeStamp}"
  Version="${OTA_HotelResNotifRQ.Version}"
  xmlns="${OTA_HotelResNotifRQ.xmlns}"
>
  ${mapPOS(OTA_HotelResNotifRQ.POS)}
  <HotelReservations>
    ${mapHotelReservation(OTA_HotelResNotifRQ.HotelReservations.HotelReservation)}
  </HotelReservations>
</OTA_HotelResNotifRQ>
`.trim();

const mapSoapHeader = uuid => `
<soap:Header xmlns:wsa="http://www.w3.org/2005/08/addressing" xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
  <wsa:MessageID>${uuid}</wsa:MessageID>
  <htng:CorrelationID xmlns:htng="http://htng.org/PWSWG/2007/02/AsyncHeaders">${uuid}</htng:CorrelationID>
  <wsa:Action>OTA_HotelResNotifRQ</wsa:Action>
  <wsa:ReplyTo>
    <wsa:Address>http://www.w3.org/2005/08/addressing/anonymous</wsa:Address>
  </wsa:ReplyTo>
  <htng:ReplyTo xmlns:htng="http://htng.org/PWSWG/2007/02/AsyncHeaders">https://glider.travel</htng:ReplyTo>
  <wsa:To>https://res-listener3.ratetiger.com/ReservationListener/HTNGGenericListenerService</wsa:To>
  <wsa:From>
    <wsa:Address>https://glider.travel</wsa:Address>
  </wsa:From>
  <wss:Security env:mustUnderstand="1" xmlns:env="http://www.w3.org/2003/05/soap-envelope" xmlns:wss="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
    <wss:UsernameToken wsu:Id="SecurityToken-cc2aa800-ee36-4539-b00e-60c3f5c1c62b">
      <wss:Username>Windingtree</wss:Username>
      <wss:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">WT@RT985</wss:Password>
      <wsu:Created>2020-01-28T01:01:48.9445401-05:00</wsu:Created>
    </wss:UsernameToken>
  </wss:Security>
</soap:Header>
`.trim();

const mapHotelResNotifSoap = ({ OTA_HotelResNotifRQ }) =>
  `<?xml version="1.0" ?>
  <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    ${mapSoapHeader(uuidv4())}
    <soap:Body>
      ${mapHotelResNotif(OTA_HotelResNotifRQ)}
    </soap:Body>
  </soap:Envelope>`
    .replace(/>\n/g, '>')
    .replace(/\n/g, ' ')
    .replace(/(\s{4})/g, '')
    .replace(/ >/g, '>')
    .replace(/ \/>/g, '/>');

module.exports = mapHotelResNotifSoap;
