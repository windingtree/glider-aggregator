const regex = require('../../../../../test/helpers/matches');
const {
  mapBookRequest, buildCustomerAddress,
} = require('./hotelResNotif');

require('chai').should();


describe('hotels/erevmax/transformInputData', () => {

  const card = {
    accountNumber: '4444333322221111',
    brand: 'visa',
    cvv: '737',
    expiryMonth: '10',
    expiryYear: '2020',
    id: 'e6266e16-eb45-4781-9788-271553dc6657',
    type: 'debit',
  };


  describe('#hotelAvailRequestTemplate', () => {
    // decide is it required to test this function
  });

  describe('#mapBookRequestFromOffer', () => {
    const offer = {
      provider: 'erevmax',
      hotelCode: '07119',
      rateCode: 'LSAVE',
      roomTypeCode: 'ND',
      rates: [
        {
          effectiveDate: '2020-07-02',
          expireDate: '2020-07-03',
          timeUnit: 'Day',
          unitMultiplier: '1',
          currency: 'SEK',
          amountAfterTax: '776.0',
        },
      ],
      guestCounts: [{ type: 'ADT', count: 2 }, { type: 'CHD', count: 1 }],
      effectiveDate: '2020-07-02',
      expireDate: '2020-07-03',
      amountBeforeTax: '640.0',
      amountAfterTax: '776.0',
      currency: 'SEK',
    };
    const passengers = {
      PAX1: {
        type: 'ADT',
        civility: 'MR',
        lastnames: ['Marley'],
        firstnames: ['Bob'],
        gender: 'Male',
        birthdate: '1980-03-21T00:00:00Z',
        contactInformation: ['+32123456789', 'contact@org.co.uk'],
      },
    };

    it('should to trow if offer has not been provided', async () => {
      (() => mapBookRequest(undefined, passengers, card)).should.to.throw;
      (() => mapBookRequest({}, passengers, card)).should.to.throw;
      (() => mapBookRequest([], passengers, card)).should.to.throw;
    });

    it('should to trow if passengers has not been provided', async () => {
      (() => mapBookRequest(offer, undefined, card)).should.to.throw;
      (() => mapBookRequest(offer, {}, card)).should.to.throw;
      (() => mapBookRequest(offer, [], card)).should.to.throw;
    });

    it('should to trow if card has not been provided', async () => {
      (() => mapBookRequest(offer, passengers, undefined)).should.to.throw;
      (() => mapBookRequest(offer, passengers, {})).should.to.throw;
      (() => mapBookRequest(offer, passengers, [])).should.to.throw;
    });

    it('should fulfill', async () => {
      const result = mapBookRequest(offer, passengers, card);
      (result).should.be.an('object').to.have.property('OTA_HotelResNotifRQ').to.be.an('object');
      (result.OTA_HotelResNotifRQ).should.to.have.property('ResStatus').to.be.a('string');
      (result.OTA_HotelResNotifRQ).should.to.have.property('Version').to.be.a('string');
      (result.OTA_HotelResNotifRQ).should.to.have.property('TimeStamp').to.be.a('string');
      (result.OTA_HotelResNotifRQ).should.to.have.property('xmlns').to.equal('http://www.opentravel.org/OTA/2003/05');
      (result.OTA_HotelResNotifRQ).should.to.have.property('EchoToken').to.be.a('string');
      (result.OTA_HotelResNotifRQ).should.to.have.property('POS').to.be.an('object');
      (result.OTA_HotelResNotifRQ).should.to.have.property('HotelReservations').to.be.an('object');

      (result.OTA_HotelResNotifRQ.POS).should.to.have.property('Source').to.be.an('object');
      (result.OTA_HotelResNotifRQ.POS.Source).should.to.have.property('RequestorID').to.be.an('object');
      (result.OTA_HotelResNotifRQ.POS.Source).should.to.have.property('BookingChannel').to.be.an('object');
      (result.OTA_HotelResNotifRQ.POS.Source.RequestorID).should.to.have.property('ID').to.be.a('string');
      (result.OTA_HotelResNotifRQ.POS.Source.RequestorID).should.to.have.property('Type').to.be.a('string');

      (result.OTA_HotelResNotifRQ.HotelReservations).should.to.have.property('HotelReservation');
      (result.OTA_HotelResNotifRQ.HotelReservations.HotelReservation).should.to.have.property('CreateDateTime').to.match(regex.dateISO);
      (result.OTA_HotelResNotifRQ.HotelReservations.HotelReservation).should.to.have.property('CreatorID').to.be.a('string');
      (result.OTA_HotelResNotifRQ.HotelReservations.HotelReservation).should.to.have.property('ResStatus').to.be.a('string');
      (result.OTA_HotelResNotifRQ.HotelReservations.HotelReservation).should.to.have.property('UniqueID').to.be.an('object');
      (result.OTA_HotelResNotifRQ.HotelReservations.HotelReservation).should.to.have.property('RoomStays').to.be.an('object');
      (result.OTA_HotelResNotifRQ.HotelReservations.HotelReservation).should.to.have.property('ResGuests').to.be.an('object');
      (result.OTA_HotelResNotifRQ.HotelReservations.HotelReservation).should.to.have.property('ResGlobalInfo').to.be.an('object');
    });
  });


  describe('#mapFromOrder', () => {
    const offer = {
      provider: 'erevmax',
      hotelCode: '07119',
      rateCode: 'LSAVE',
      roomTypeCode: 'ND',
      rates: [
        {
          effectiveDate: '2020-07-02',
          expireDate: '2020-07-03',
          timeUnit: 'Day',
          unitMultiplier: '1',
          currency: 'SEK',
          amountAfterTax: '776.0',
        },
      ],
      guestCounts: [{ type: 'ADT', count: 2 }, { type: 'CHD', count: 1 }],
      effectiveDate: '2020-07-02',
      expireDate: '2020-07-03',
      amountBeforeTax: '640.0',
      amountAfterTax: '776.0',
      currency: 'SEK',
    };
    const passengers = {
      PAX1: {
        type: 'ADT',
        civility: 'MR',
        lastnames: ['Marley'],
        firstnames: ['Bob'],
        gender: 'Male',
        birthdate: '1980-03-21T00:00:00Z',
        contactInformation: ['+32123456789', 'contact@org.co.uk'],
      },
    };


    it('should to trow if offer has not been provided', async () => {
      (() => mapBookRequest(undefined, passengers, card)).should.to.throw;
      (() => mapBookRequest({}, passengers, card)).should.to.throw;
      (() => mapBookRequest([], passengers, card)).should.to.throw;
    });

    it('should to trow if passengers has not been provided', async () => {
      (() => mapBookRequest(offer, undefined, card)).should.to.throw;
      (() => mapBookRequest(offer, {}, card)).should.to.throw;
      (() => mapBookRequest(offer, [], card)).should.to.throw;
    });

    it('should to trow if card has not been provided', async () => {
      (() => mapBookRequest(offer, passengers, undefined)).should.to.throw;
      (() => mapBookRequest(offer, passengers, {})).should.to.throw;
      (() => mapBookRequest(offer, passengers, [])).should.to.throw;
    });

    it('should fulfill', async () => {
      const result = mapBookRequest(offer, passengers, card);
      (result).should.be.an('object').to.have.property('OTA_HotelResNotifRQ').to.be.an('object');
      (result.OTA_HotelResNotifRQ).should.to.have.property('ResStatus').to.be.a('string');
      (result.OTA_HotelResNotifRQ).should.to.have.property('Version').to.be.a('string');
      (result.OTA_HotelResNotifRQ).should.to.have.property('TimeStamp').to.be.a('string');
      (result.OTA_HotelResNotifRQ).should.to.have.property('xmlns').to.equal('http://www.opentravel.org/OTA/2003/05');
      (result.OTA_HotelResNotifRQ).should.to.have.property('EchoToken').to.be.a('string');
      (result.OTA_HotelResNotifRQ).should.to.have.property('POS').to.be.an('object');
      (result.OTA_HotelResNotifRQ).should.to.have.property('HotelReservations').to.be.an('object');

      (result.OTA_HotelResNotifRQ.POS).should.to.have.property('Source').to.be.an('object');
      (result.OTA_HotelResNotifRQ.POS.Source).should.to.have.property('RequestorID').to.be.an('object');
      (result.OTA_HotelResNotifRQ.POS.Source).should.to.have.property('BookingChannel').to.be.an('object');
      (result.OTA_HotelResNotifRQ.POS.Source.RequestorID).should.to.have.property('ID').to.be.a('string');
      (result.OTA_HotelResNotifRQ.POS.Source.RequestorID).should.to.have.property('Type').to.be.a('string');

      (result.OTA_HotelResNotifRQ.HotelReservations).should.to.have.property('HotelReservation');
      (result.OTA_HotelResNotifRQ.HotelReservations.HotelReservation).should.to.have.property('CreateDateTime').to.match(regex.dateISO);
      (result.OTA_HotelResNotifRQ.HotelReservations.HotelReservation).should.to.have.property('CreatorID').to.be.a('string');
      (result.OTA_HotelResNotifRQ.HotelReservations.HotelReservation).should.to.have.property('ResStatus').to.be.a('string');
      (result.OTA_HotelResNotifRQ.HotelReservations.HotelReservation).should.to.have.property('UniqueID').to.be.an('object');
      (result.OTA_HotelResNotifRQ.HotelReservations.HotelReservation).should.to.have.property('RoomStays').to.be.an('object');
      (result.OTA_HotelResNotifRQ.HotelReservations.HotelReservation).should.to.have.property('ResGuests').to.be.an('object');
      (result.OTA_HotelResNotifRQ.HotelReservations.HotelReservation).should.to.have.property('ResGlobalInfo').to.be.an('object');
    });
  });

  describe('#buildCustomerAddress', () => {
    const pax = {
      type: 'ADT',
      civility: 'MR',
      lastnames: ['Marley'],
      firstnames: ['Bob'],
      gender: 'Male',
      birthdate: '1980-03-21T00:00:00Z',
      contactInformation: ['+32123456789', 'contact@org.co.uk'],
      address: {
        lines: [
          'str. One',
          'flat 2',
        ],
        city: 'City',
        postalCode: '1234567',
        subdivision: '',
        country: 'PL',
      },
    };

    it('should to throw if wrong pax has been provided', async () => {
      (() => buildCustomerAddress(Object.assign({}, pax, { address: 'wrongType' }))).should.to.throw;
    });

    it('should build customer address', async () => {
      const result = buildCustomerAddress(pax);
      (result).should.be.an('object').to.have.property('Type').to.equal('1');
      (result).should.to.have.property('AddressLines').to.deep.equal(pax.address.lines);
      (result).should.to.have.property('CityName').to.equal(pax.address.city);
      (result).should.to.have.property('PostalCode').to.equal(pax.address.postalCode);
      (result).should.to.have.property('StateProv').to.equal(pax.address.subdivision);
      (result).should.to.have.property('CountryName').to.be.an('object')
        .to.have.property('Code').to.equal(pax.address.country);
    });
  });





});
