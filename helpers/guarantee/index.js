const axios = require('axios');
const config = require('../../config');
const GliderError = require('../error');

const simardHeaders = {
  Authorization: `Bearer ${config.SIMARD_JWT}`,
};

const processSimardError = e => {
  let message = e.message;
  let status = 500;

  if (e.response && e.response.status && e.response.data.message) {
    message = e.response.data.message;
    status = e.response.status;
  }
  console.log('Got simard error, JWT that was used:', config.SIMARD_JWT);
  throw new GliderError(message, status);
};

// Get and verify guarantee
module.exports.getGuarantee = async (id, offer) => {
  let guarantee;
  console.log(`Get guarantee ID:${id}`);
  if (!id) {
    throw new GliderError(
      'Guarantee Id is required',
      400,
    );
  }

  try {
    // Get the guarantee
    const response = await axios.get(
      `${config.SIMARD_URL}/balances/guarantees/${id}`,
      {
        headers: simardHeaders,
      },
    );

    guarantee = response.data;

    // Check guarantee currency
    if (guarantee.currency !== offer.currency) {
      throw new GliderError(
        `The guarantee currency: ${guarantee.currency} is different from offer currency: ${offer.currency}`,
        400,
      );
    }

    // Check guarantee amount
    if (Number(guarantee.amount) < Number(offer.amountAfterTax)) {
      throw new GliderError(
        `The guarantee amount: ${guarantee.currency} is less then offer amount: ${offer.amountAfterTax}`,
        400,
      );
    }

    // Check guarantee expiration date
    // Should be more than 72 hours from now
    if (new Date(guarantee.expiration).getTime() < (Date.now() + 60 * 60 * 72 * 1000)) {
      throw new GliderError(
        `The guarantee expiration date: ${guarantee.expiration} is less then 72 hours from now`,
        400,
      );
    }
  } catch (e) {
    console.error(`Get guarantee failed:${e.message?e.message:e}`);
    processSimardError(e);
  }

  return guarantee;
};

// Claim the guarantee
module.exports.claimGuarantee = async (id) => {
  let claim;
  console.log(`Claim guarantee (without card) ${id}`);
  try {
    const response = await axios.post(
      `${config.SIMARD_URL}/balances/guarantees/${id}/claim`,
      {},
      {
        headers: simardHeaders,
      },
    );
    claim = response.data;
  } catch (e) {
    console.error(`Claim  guarantee failed ${e.message?e.message:e}`);
    processSimardError(e);
  }
  return claim;
};

// Claim the guarantee with card
module.exports.claimGuaranteeWithCard = async (id) => {
  console.log(`Claim guarantee with card ${id}`);
  let claim;

  try {
    const response = await axios.post(
      `${config.SIMARD_URL}/balances/guarantees/${id}/claimWithCard`,
      {
        // Date.now() + 7 days
        expiration: new Date(Date.now() + 60 * 1000 * 60 * 24 * 7).toISOString(),
      },
      {
        headers: simardHeaders,
      },
    );
    claim = response.data;
  } catch (e) {
    console.error(`Claim  guarantee failed ${e.message?e.message:e}`);
    processSimardError(e);
  }

  return claim;
};

// refund
module.exports.refundSettlement = async (settlementId, amount, currency) => {
  console.log(`Refund settlement ${settlementId}, amount: ${amount}${currency}`);
  let result;
  try {
    const response = await axios.post(
      `${config.SIMARD_URL}//balances/refund`,
      {
        'currency': currency,
        'amount': amount,
        'settlementId': settlementId,
      },
      {
        headers: simardHeaders,
      },
    );
    result = response.data;
  } catch (e) {
    console.error(`Refund settlement failed ${e.message?e.message:e}`);
    processSimardError(e);
  }
  return result;
};

// Create virtual card for guarantee
module.exports.createVirtualCard = async (amount, currency) => {
  console.log(`Creating virtual card for amount: ${amount}${currency}`);
  let cardDetails;

  if (!amount || Number(amount) <= 0) {
    throw new GliderError('Missing or incorrect amount', 400);
  }
  try {
    const response = await axios.post(
      `${config.SIMARD_URL}/cards`,
      {
        currency: currency,
        amount: amount,
        expiration: new Date(Date.now() + 60 * 1000 * 60 * 24 * 7).toISOString(),  //7 days
      },
      {
        headers: simardHeaders,
      },
    );
    cardDetails = response.data;
  } catch (e) {
    console.error(`Creating virtual card failed:${e.message?e.message:e}`);
    processSimardError(e);
  }

  return cardDetails;
};

// delete guarantee
module.exports.deleteGuarantee = async (guaranteeId) => {
  console.log(`Delete guarantee ${guaranteeId}`);
  if (!guaranteeId) {
    throw new GliderError('Guarantee Id is required', 400);
  }
  try {
    await axios.delete(
      `${config.SIMARD_URL}/balances/guarantees/${guaranteeId}`,
      {
        headers: simardHeaders,
      },
    );

  } catch (e) {
    console.error(`Delete guarantee failed ${e.message?e.message:e}`);
    processSimardError(e);
  }
};


// Create virtual card for guarantee
module.exports.deleteVirtualCard = async (cardId) => {
  console.log(`Delete virtual card ${cardId}`);
  if (!cardId) {
    throw new GliderError('Card Id is required', 400);
  }
  try {
    await axios.delete(
      `${config.SIMARD_URL}/cards/${cardId}`,
      {
        headers: simardHeaders,
      },
    );

  } catch (e) {
    console.error(`Delete virtual failed ${e.message?e.message:e}`);
    processSimardError(e);
  }
};
