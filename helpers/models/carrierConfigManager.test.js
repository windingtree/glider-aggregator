const expect = require('chai').expect;
const CarrierConfigurationModel = require('./mongo/carrierConfig');
const { getCarrierDetails, getFareFamily } = require('./carrierConfigManager');
const assert = require('assert');


const dummyCarrierConfig =
  {
    carrierCode: 'XYZ',
    brandedFares: [{
      brandedFareId : 'BASIC',
      brandedFareName : 'Basic',
      refundable: false,
      changeable: false,
      penalties: false,
      checkedBaggages: {
        quantity: 0,
      },
      amenities: [
        'free snack',
      ],
    },
    {
      brandedFareId : 'FLEX',
      brandedFareName : 'Flex',
      refundable: true,
      changeable: true,
      penalties: true,
      checkedBaggages: {
        quantity: 1,
      },
      amenities: [
        '1 checked bag',
        'meal on board',
      ],
    }],
  };


describe('CarrierConfiguration', () => {
  before(async () => {
    let Model = await CarrierConfigurationModel();
    let record = new Model(dummyCarrierConfig);
    await record.save();
  });
  after(async () => {
    let Model = await CarrierConfigurationModel();
    await Model.deleteOne({ carrierCode: dummyCarrierConfig.carrierCode });
  });

  describe('#getCarrierDetails', () => {
    it('should return carrier config when it exists in a database', async () => {
      let result = await getCarrierDetails('XYZ');
      expect(result).not.empty;
      expect(result).to.have.property('carrierCode').equal('XYZ');
      expect(result).to.have.property('brandedFares').to.be.an('array');
    });

    it('should return carrier config also if carrier code is lowercase', async () => {
      let result = await getCarrierDetails('xyz');
      expect(result).not.empty;
      expect(result).to.have.property('carrierCode').equal('XYZ');
      expect(result).to.have.property('brandedFares').to.be.an('array');
    });

    it('should return undefined if carrier config is missing', async () => {
      let result = await getCarrierDetails('DUMMY');
      expect(result).to.be.null;
    });

    it('should throw exception on missing parameter', async () => {
      await assert.rejects(async () => {
        await getCarrierDetails();
      });
    });
  });

  describe('Fare Families', () => {
    it('should return existing fare family', async () => {
      let flex = await getFareFamily('XYZ', 'Flex');
      expect(flex).to.be.not.empty;
      expect(flex).to.be.an('object');
      expect(flex).to.have.property('brandedFareId').equal('FLEX');
    });
    it('should return existing fare family also if name case does not match ', async () => {
      let flex = await getFareFamily('XYZ', 'FLEX');
      expect(flex).to.be.not.empty;
      expect(flex).to.be.an('object');
      expect(flex).to.have.property('brandedFareId').equal('FLEX');
    });
    it('should return empty if name case does not match ', async () => {
      let flex = await getFareFamily('XYZ', 'DUMMY');
      expect(flex).to.be.null;
    });
  });
});
