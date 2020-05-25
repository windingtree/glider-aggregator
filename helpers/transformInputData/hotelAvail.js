const format = require('date-fns/format');
const differenceInCalendarDays = require('date-fns/differenceInCalendarDays');
const parseISO = require('date-fns/parseISO');

const mapRequestData = (hotelCodes, { accommodation: { arrival, departure }, passengers }) => {
  const duration = differenceInCalendarDays(parseISO(departure), parseISO(arrival));
  const guestCounts = passengers
    .map(
      ({ type, count }) => ({
        AgeQualifyingCode: type === 'ADT' ? 10 : 8,
        Count: count === undefined ? 1: count,
      })
    );

  const hotelSearchCriteria = hotelCodes
    .map(
      hotelCode => ({
        HotelRef: {
          HotelCode: hotelCode,
          StayDateRange: {
            Start:  format(new Date(arrival), 'yyyy-MM-dd'),
            Duration: duration,
            RoomStayCandidates: {
              RoomStayCandidate: {
                Quantity: '1',
                GuestCounts: guestCounts,
              }
            }
          }
        }
      })
    );

  return {
    OTA_HotelAvailRQ: {
      TimeStamp: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSS'+01:00'"), // eslint-disable-line quotes
      Version: '2.2',
      PrimaryLangID: 'en',
      AvailRatesOnly: true,
      RequestedCurrency: 'EUR',
      Type: '7',
      ID: 'Windingtree',
      xmlns: 'http://www.opentravel.org/OTA/2003/05',
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
      TPA_Extensions: {
        isDeepLinkRequired: {
          DeepLinkType: 'URL',
          isDeepLinkRequired: false,
        },
        isContentRequired: {
          isAmenityRequired: true,
          isContentRequired: true,
        },
        isCancellationPolicyRequired: {
          isCancellationPolicyRequired : true,
        }
      }
    }
  };
};

module.exports = {
  mapRequestData
};
