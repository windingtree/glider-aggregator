const GliderError = require('../../error');

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

module.exports.getCardCode = card => {
  const cardCode = cardCodes[card.brand.toLowerCase()];

  if (!cardCode) {
    throw new GliderError('Unknown claimed card brand', 500);
  }

  return cardCode;
};
