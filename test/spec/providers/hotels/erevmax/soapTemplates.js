const {
  mapGuestCount,
  mapGuestCounts,
  mapRate,
  mapRates,
  mapRoomRate,
  mapPaymentCard,
  mapGuarantee,
} = require('../../../../../helpers/providers/hotels/erevmax/camaroTemplates/ota/otaHotelResNotifRQ');

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


    describe('#mapGuarantee', () => {
    let offer = {
      'provider': 'revmax',
      'hotelCode': '209093',
      'rateCode': 'BAR',
      'roomTypeCode': 'ND',
      'rates': [
        {
          'effectiveDate': '2020-09-27',
          'expireDate': '2020-09-28',
          'timeUnit': 'Day',
          'unitMultiplier': '1',
          'currency': 'EUR',
          'amountAfterTax': '107.31',
        },
        {
          'effectiveDate': '2020-09-28',
          'expireDate': '2020-09-29',
          'timeUnit': 'Day',
          'unitMultiplier': '1',
          'currency': 'EUR',
          'amountAfterTax': '116.29',
        },
        {
          'effectiveDate': '2020-09-29',
          'expireDate': '2020-09-30',
          'timeUnit': 'Day',
          'unitMultiplier': '1',
          'currency': 'EUR',
          'amountAfterTax': '116.29',
        },
        {
          'effectiveDate': '2020-09-30',
          'expireDate': '2020-10-01',
          'timeUnit': 'Day',
          'unitMultiplier': '1',
          'currency': 'EUR',
          'amountAfterTax': '116.29',
        },
        {
          'effectiveDate': '2020-10-01',
          'expireDate': '2020-10-02',
          'timeUnit': 'Day',
          'unitMultiplier': '1',
          'currency': 'EUR',
          'amountAfterTax': '107.31',
        },
        {
          'effectiveDate': '2020-10-02',
          'expireDate': '2020-10-03',
          'timeUnit': 'Day',
          'unitMultiplier': '1',
          'currency': 'EUR',
          'amountAfterTax': '101.02',
        },
        {
          'effectiveDate': '2020-10-03',
          'expireDate': '2020-10-04',
          'timeUnit': 'Day',
          'unitMultiplier': '1',
          'currency': 'EUR',
          'amountAfterTax': '93.84',
        },
        {
          'effectiveDate': '2020-10-04',
          'expireDate': '2020-10-05',
          'timeUnit': 'Day',
          'unitMultiplier': '1',
          'currency': 'EUR',
          'amountAfterTax': '107.31',
        },
        {
          'effectiveDate': '2020-10-05',
          'expireDate': '2020-10-06',
          'timeUnit': 'Day',
          'unitMultiplier': '1',
          'currency': 'EUR',
          'amountAfterTax': '107.31',
        },
        {
          'effectiveDate': '2020-10-06',
          'expireDate': '2020-10-07',
          'timeUnit': 'Day',
          'unitMultiplier': '1',
          'currency': 'EUR',
          'amountAfterTax': '116.29',
        },
        {
          'effectiveDate': '2020-10-07',
          'expireDate': '2020-10-08',
          'timeUnit': 'Day',
          'unitMultiplier': '1',
          'currency': 'EUR',
          'amountAfterTax': '116.29',
        },
        {
          'effectiveDate': '2020-10-08',
          'expireDate': '2020-10-09',
          'timeUnit': 'Day',
          'unitMultiplier': '1',
          'currency': 'EUR',
          'amountAfterTax': '107.31',
        },
        {
          'effectiveDate': '2020-10-09',
          'expireDate': '2020-10-10',
          'timeUnit': 'Day',
          'unitMultiplier': '1',
          'currency': 'EUR',
          'amountAfterTax': '93.84',
        },
        {
          'effectiveDate': '2020-10-10',
          'expireDate': '2020-10-11',
          'timeUnit': 'Day',
          'unitMultiplier': '1',
          'currency': 'EUR',
          'amountAfterTax': '93.84',
        },
        {
          'effectiveDate': '2020-10-11',
          'expireDate': '2020-10-12',
          'timeUnit': 'Day',
          'unitMultiplier': '1',
          'currency': 'EUR',
          'amountAfterTax': '107.31',
        },
        {
          'effectiveDate': '2020-10-12',
          'expireDate': '2020-10-13',
          'timeUnit': 'Day',
          'unitMultiplier': '1',
          'currency': 'EUR',
          'amountAfterTax': '107.31',
        },
        {
          'effectiveDate': '2020-10-13',
          'expireDate': '2020-10-14',
          'timeUnit': 'Day',
          'unitMultiplier': '1',
          'currency': 'EUR',
          'amountAfterTax': '116.29',
        },
        {
          'effectiveDate': '2020-10-14',
          'expireDate': '2020-10-15',
          'timeUnit': 'Day',
          'unitMultiplier': '1',
          'currency': 'EUR',
          'amountAfterTax': '116.29',
        },
        {
          'effectiveDate': '2020-10-15',
          'expireDate': '2020-10-16',
          'timeUnit': 'Day',
          'unitMultiplier': '1',
          'currency': 'EUR',
          'amountAfterTax': '107.31',
        },
        {
          'effectiveDate': '2020-10-16',
          'expireDate': '2020-10-17',
          'timeUnit': 'Day',
          'unitMultiplier': '1',
          'currency': 'EUR',
          'amountAfterTax': '107.31',
        },
        {
          'effectiveDate': '2020-10-17',
          'expireDate': '2020-10-18',
          'timeUnit': 'Day',
          'unitMultiplier': '1',
          'currency': 'EUR',
          'amountAfterTax': '107.31',
        },
        {
          'effectiveDate': '2020-10-18',
          'expireDate': '2020-10-19',
          'timeUnit': 'Day',
          'unitMultiplier': '1',
          'currency': 'EUR',
          'amountAfterTax': '107.31',
        },
        {
          'effectiveDate': '2020-10-19',
          'expireDate': '2020-10-20',
          'timeUnit': 'Day',
          'unitMultiplier': '1',
          'currency': 'EUR',
          'amountAfterTax': '107.31',
        },
        {
          'effectiveDate': '2020-10-20',
          'expireDate': '2020-10-21',
          'timeUnit': 'Day',
          'unitMultiplier': '1',
          'currency': 'EUR',
          'amountAfterTax': '116.29',
        },
        {
          'effectiveDate': '2020-10-21',
          'expireDate': '2020-10-22',
          'timeUnit': 'Day',
          'unitMultiplier': '1',
          'currency': 'EUR',
          'amountAfterTax': '116.29',
        },
        {
          'effectiveDate': '2020-10-22',
          'expireDate': '2020-10-23',
          'timeUnit': 'Day',
          'unitMultiplier': '1',
          'currency': 'EUR',
          'amountAfterTax': '107.31',
        },
        {
          'effectiveDate': '2020-10-23',
          'expireDate': '2020-10-24',
          'timeUnit': 'Day',
          'unitMultiplier': '1',
          'currency': 'EUR',
          'amountAfterTax': '93.84',
        },
        {
          'effectiveDate': '2020-10-24',
          'expireDate': '2020-10-25',
          'timeUnit': 'Day',
          'unitMultiplier': '1',
          'currency': 'EUR',
          'amountAfterTax': '93.84',
        },
      ],
      'guestCounts': [
        {
          'type': 'ADT',
          'count': 1,
        },
        {
          'type': 'CHD',
          'count': 0,
        },
      ],
      'effectiveDate': '2020-09-27',
      'expireDate': '2020-10-25',
      'amountBeforeTax': '3011.85',
      'amountAfterTax': '3011.85',
      'currency': 'EUR',
    }


      it('should map data', async () => {
        const result = mapGuarantee(OTA_Guarantee);
        (result).should.equal('<Guarantee\n  GuaranteeType="GuaranteeRequired"\n  GuaranteeCode="GCC"\n>\n  <GuaranteesAccepted>\n      <GuaranteeAccepted><PaymentCard CardCode="VI" CardNumber="4444333322221111" CardType="1" ExpireDate="1024" SeriesCode="111"><CardHolderName>TEST</CardHolderName></PaymentCard></GuaranteeAccepted>\n  </GuaranteesAccepted>\n  <GuaranteeDescription>\n      <Text>Credit Card Guarantee</Text>\n  </GuaranteeDescription>\n</Guarantee>');
      });
    });





  });
});
