const GliderError = require('../../error');

const cardCodesOTA = {
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
module.exports.cardCodesOTA = cardCodesOTA;

const cardCodesIATA = {
  visa: 'VI',
  mastercard: 'CA',
  amex: 'AX',
  diners: 'DC',
  discover: 'DS',
  jcb: 'JC',
  uatp: 'TP',
};
module.exports.cardCodesIATA = cardCodesIATA;

module.exports.getCardCode = (card, type) => {
  let cardCode;
  switch(type) {
    case 'iata':
      cardCode = cardCodesIATA[card.brand.toLowerCase()];
      break;
    case 'ota':
      cardCode = cardCodesOTA[card.brand.toLowerCase()];
      break;
    default:
      throw new GliderError('Missing Card Code type', 500);
  }

  return cardCode;
};
