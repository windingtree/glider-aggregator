const format = require('date-fns/format');
// const differenceInCalendarDays = require('date-fns/differenceInCalendarDays');
// const parseISO = require('date-fns/parseISO');
const { v4: uuidv4 } = require('uuid');
const emailValidator = require('email-validator');
const GliderError = require('../error');

/*
  Maps an offer and passengers to an OTA HotelResNotifRQ structure
*/
const mapFromOffer = (offer, passengers, card) => {

  const orderId = uuidv4();
  const resId = orderId.substr(24);

  // Build the POS
  const pos = {
    Source: {
      RequestorID: {
        ID: 'Windingtree',
        Type: '22',
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
  };

  const cardCodes = {
    visa: 'VI',
    mastercard: 'MC',
    amex: 'AX',
    bancontact: 'BC',
    diners: 'DN',
    discover: 'DS',
    jcb: 'JC',
    maestro: 'MA',
    uatp: 'TP',
    unionpay: 'CU',
    electron: 'VE'
  };

  if (!cardCodes[card.brand.toLowerCase()]) {
    throw new GliderError('Unknown claimed card brand', 500);
  }

  // Build the Guarantee
  const guarantee = {
    GuaranteeType: 'GuaranteeRequired', // Check !!
    GuaranteeCode: 'GCC',
    PaymentCard: {
      CardType: '1', // 1-Credit as per erevmax doc,
      CardCode: cardCodes[card.brand.toLowerCase()],
      CardNumber: card.accountNumber,
      ExpireDate: `${card.expiryMonth}${card.expiryYear.substr(-2)}`, // MMYY format
      //CardHolderName: OPTIONAL
    },
    GuaranteeDescription: 'Credit Card Guarantee',
  };

  // Build the rate
  const rates = offer.rates.map(rate => ({
    RateTimeUnit: rate.timeUnit,
    EffectiveDate: rate.effectiveDate,
    ExpireDate: rate.expireDate,
    UnitMultiplier: rate.unitMultiplier,
    Base: {
      CurrencyCode: rate.currency,
      AmountAfterTax: rate.amountAfterTax,
    }
  }));

  // Build the Guest counts
  const guestCounts = offer.guestCounts.map(({
    type,
    count
  }) => ({
    AgeQualifyingCode: type === 'ADT' ? 10 : 8,
    Count: count === undefined ? 1 : count,
  }));

  // Build the room stay
  const roomStay = {
    RatePlans: {
      RatePlan: {
        RatePlanCode: offer.rateCode,
      },
    },
    RoomRates: {
      RoomRate: {
        RoomTypeCode: offer.roomTypeCode,
        NumberOfUnits: '1',
        RatePlanCode: offer.rateCode,
        Rates: rates,
        Total: {
          CurrencyCode: offer.currency,
          AmountAfterTax: offer.amountAfterTax,
        },
      },
    },
    GuestCounts: guestCounts,
    TimeSpan: {
      Start: offer.effectiveDate, // Check-in Date
      End: offer.expireDate, // Check-out Date
    },
    Guarantee: guarantee,
    Total: {
      CurrencyCode: offer.currency,
      AmountAfterTax: offer.amountAfterTax,
      Taxes: {
        Amount: (Number(offer.amountAfterTax) - Number(offer.amountBeforeTax)).toFixed(2),
        CurrencyCode: offer.currency
      }
    },
    BasicPropertyInfo: {
      HotelCode: offer.hotelCode,
    },
    ResGuestRPHs: {
      ResGuestRPH: {
        RPH: '1',
      },
    },
  };

  let customer = {};
  const pax = passengers.PAX1;

  // Handle the Custoner Names
  customer.PersonName = {};
  if (pax.civility !== undefined) customer.PersonName.NamePrefix = pax.civility;
  if (pax.firstnames !== undefined) customer.PersonName.GivenName = pax.firstnames.join(' ');
  if (pax.middlenames !== undefined) customer.PersonName.MiddleName = pax.middlenames.join(' ');
  if (pax.lastnames !== undefined) customer.PersonName.Surname = pax.lastnames.join(' ');

  // Handle the passenger contact information
  for (let contact of pax.contactInformation) {
    if (emailValidator.validate(contact)) {
      customer.Email = {
        EmailType: '1',
        email: contact,
      };
    } else if (contact.match(/^\+[0-9]+$/)) {
      customer.Telephone = {
        FormattedInd: false,
        PhoneNumber: contact,
        PhoneTechType: '1',
      };
    }
  }

  // Handle the passenger address
  if (pax.address !== undefined) {
    customer.Address = {};
    customer.Address.Type = '1';
    if (pax.address.lines !== undefined) customer.Address.AddressLines = pax.address.lines;
    if (pax.address.city !== undefined) customer.Address.CityName = pax.address.city;
    if (pax.address.postalCode !== undefined) customer.Address.PostalCode = pax.address.postalCode;
    if (pax.address.subdivision !== undefined) customer.Address.StateProv = pax.address.subdivision;
    if (pax.address.country !== undefined) customer.Address.CountryName = {
      Code: pax.address.country
    };
  }

  return {
    'OTA_HotelResNotifRQ': {
      ResStatus: 'Commit',
      Version: '2.000',
      TimeStamp: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
      xmlns: 'http://www.opentravel.org/OTA/2003/05',
      EchoToken: uuidv4(),
      POS: pos,
      HotelReservations: {
        HotelReservation: {
          CreateDateTime: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
          CreatorID: 'WindingTree',
          ResStatus: 'Commit',
          UniqueID: {
            ID: resId,
            Type: '14',
          },
          RoomStays: {
            RoomStay: roomStay,
          },
          ResGuests: {
            ResGuest: {
              PrimaryIndicator: 'true',
              ResGuestRPH: '1',
              Profiles: {
                ProfileInfo: {
                  Profile: {
                    ProfileType: '1',
                    Customer: customer,
                    CompanyInfo: {
                      CompanyName: '',
                    },
                  },
                },
              },
            },
          },
          ResGlobalInfo: {
            HotelReservationIDs: {
              HotelReservationID: {
                'ResID_Source': 'Windingtree',
                'ResID_Type': '22',
                'ResID_Value': resId
              },
            },
          },
        },
      },
    },
  };
};

module.exports.mapFromOffer = mapFromOffer;
