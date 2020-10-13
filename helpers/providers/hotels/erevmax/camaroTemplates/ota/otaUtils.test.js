const {
  mapGuestCounts
} = require('./otaUtils');

require('chai').should();

describe('proviers/hotels/erevmax/utils', () => {

  describe('soapTemplates/ota', () => {

    describe('#mapGuestCounts', () => {
      const OTA_GuestCount = {
        Count: 1,
        AgeQualifyingCode: 10
      };

      it('should map data', async () => {
        const result = mapGuestCounts([
          OTA_GuestCount,
          OTA_GuestCount
        ]);
        (result).should.equal('<GuestCount AgeQualifyingCode="10" Count="1"/><GuestCount AgeQualifyingCode="10" Count="1"/>');
      });
    });
  });
});


