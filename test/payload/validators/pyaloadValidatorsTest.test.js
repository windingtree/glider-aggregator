const { validateCreateOfferPayload, validateSearchCriteria, validateOptionSelection } = require('../../../helpers/payload/validators/');
const GliderError = require('../../../helpers/error');
const assert = require('chai').assert;

describe('/createWithOffer payload validator', () => {
  let payloads = require('./createWithOffer.json');

  describe('valid payload', () => {
    payloads.valid.forEach(payload => {
      it('should pass validation on valid payload', () => {
        let validPayload = validateCreateOfferPayload(payload);
        assert.deepEqual(validPayload, payload);
      });
    });
  });


  describe('invalid payload', () => {
    payloads.invalid.forEach(payload => {
      it('should fail validation on invalid payload', () => {
        assert.throws(() => validateCreateOfferPayload(payload), GliderError);
      });
    });
  });
});


describe('/searchOffers payload validator', () => {
  let payloads = require('./searchOffers.json');
  describe('valid payload', () => {
    payloads.valid.forEach(payload => {
      it('should pass validation on valid payload', () => {
        let validPayload = validateSearchCriteria(payload);
        assert.deepEqual(validPayload, payload);
      });
    });
  });


  describe('invalid payload', () => {
    payloads.invalid.forEach(payload => {
      it('should fail validation on invalid payload', () => {
        assert.throws(() => validateSearchCriteria(payload), GliderError);
      });
    });
  });
});

describe('/offers payload validator', () => {
  let payloads = require('./offersPrice.json');
  describe('valid payload', () => {
    payloads.valid.forEach(payload => {
      it('should pass validation on valid payload', () => {
        let validPayload = validateOptionSelection(payload);
        assert.deepEqual(validPayload, payload);
      });
    });
  });


  describe('invalid payload', () => {
    payloads.invalid.forEach(payload => {
      it('should fail validation on invalid payload', () => {
        assert.throws(() => validateOptionSelection(payload), GliderError);
      });
    });
  });
});
