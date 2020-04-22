const format = require('date-fns/format');
const { getCardCode } = require('./utils/cardUtils');

module.exports.mapNdcRequestData_AF = (config, { offerId, offerItems, passengers }) => ({
  ...(JSON.parse(JSON.stringify(config))),
  trackingMessageHeader: {
    consumerRef : {
      consumerTime: (new Date(Date.now())).toISOString(),
    },
  },
  Query: {
    Order: {
      Offer: {
        OfferId: offerId,
        Owner: config.AirlineID,
        OfferItems: offerItems,
      },
    },
    DataList: {
      passengers,
    },
  },
});

module.exports.mapNdcRequestData_AC = (
  { apiKey, commission, AirlineID, ...config },// extract the only needed part of config
  offer,
  body,
  guaranteeClaim
) => ({
  ...(JSON.parse(JSON.stringify(config))),
  Query: {
    Order: {
      Offer: {
        '@Owner': config.AirlineID,
        '@OfferID': offer.extraData && offer.extraData.offerId
          ? offer.extraData.offerId
          : body.offerId,
        '@ResponseID': '',
        TotalOfferPrice: {
          '@Code': offer.currency,
          '@value': offer.amountAfterTax
        },
        OfferItem: Object.entries(body.offerItems).map(o => ({
          '@OfferItemID': o[0],
          PassengerRefs: o[1].passengerReferences
        }))
      }
    },
    ...(body.guaranteeId ? {
      Payment: {
        Type: 'CC',
        Method: {
          PaymentCard: {
            CardType: 1,
            CardCode: getCardCode(guaranteeClaim.card),
            CardNumber: guaranteeClaim.card.accountNumber,
            ...(guaranteeClaim.card.cvv ? {
              SeriesCode: guaranteeClaim.card.cvv
            } : {}),
            EffectiveExpireDate: {
              Expiration: `${guaranteeClaim.card.expiryMonth}${guaranteeClaim.card.expiryYear.substr(-2)}`
            }
          }
        },
        Amount: {
          '@Code': offer.currency,
          '@value': offer.amountAfterTax
        }
      }
    } : {}),
    DataLists: {
      PassengerList: {
        Passenger: Object.entries(body.passengers).map(p => ({
          '@PassengerID': p[0],
          PTC: p[1].type,
          Birthdate: format(new Date(p[1].birthdate), 'yyyy-MM-dd'),
          Individual: {
            Gender: p[1].gender,
            NameTitle: p[1].civility,
            GivenName: p[1].lastnames.join(' '),
            Surname: p[1].firstnames.join(' ')
          },
          ContactInfoRef: 'CTC1'
        }))
      },
      ContactList: {
        ContactInformation: Object.entries(body.passengers).map((p, i) => ({
          '@ContactID': `CTC${i + 1}`,
          ContactType: '1.PTT',
          ContactProvided: p[1].contactInformation.map(c => {
            if (c.indexOf('@') !== -1) {
              return {
                EmailAddress: {
                  EmailAddressValue: c
                }
              };
            } else if (c.indexOf('+') !== -1) {
              const phone = c.match(/^\+(\d{1})(\d{3})(\d+)$/);
              return {
                Phone: {
                  Label: '8.PLT',
                  CountryDialingCode: phone[1],
                  AreaCode: phone[2],
                  PhoneNumber: phone[3]
                }
              };
            } else {
              return null;
            }
          }).filter(c => c !== null)
        }))
      },
      FlightSegmentList: {
        FlightSegment: offer.extraData.segments.map(s => ({
          '@SegmentKey': s.id,
          '@ElectronicTicketInd': true,
          Departure: s.Departure,
          Arrival: s.Arrival,
          MarketingCarrier: s.MarketingCarrier,
          OperatingCarrier: s.OperatingCarrier,
          Equipment: s.Equipment,
          ClassOfService: s.ClassOfService,
          FlightDetail: s.FlightDetail
        }))
      },
      OriginDestinationList: {
        OriginDestination: offer.extraData.destinations.map(d => ({
          '@OriginDestinationKey': d.id,
          DepartureCode: d.DepartureCode,
          ArrivalCode: d.ArrivalCode,
          FlightReferences: d.FlightReferences
        }))
      },
      InstructionsList: {
        Instruction: {
          '@ListKey': 'eTicket',
          FreeFormTextInstruction: {
            Remark: body.guaranteeId ? '3.TST' : '1.TST'
          }
        }
      }
    }
  }
});
