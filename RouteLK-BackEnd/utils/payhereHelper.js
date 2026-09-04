const crypto = require('crypto');

/**
 * Generate MD5 hash required for PayHere Checkout form / JavaScript SDK
 * Formula: strtoupper(md5(merchant_id + order_id + amountFormatted + currency + strtoupper(md5(merchant_secret))))
 *
 * @param {string} merchantId - PayHere Merchant ID
 * @param {string} orderId - Unique internal order / transaction reference
 * @param {number|string} amount - Transaction amount
 * @param {string} currency - Currency code (e.g. 'LKR')
 * @param {string} merchantSecret - Merchant Secret key from PayHere dashboard
 * @returns {string} Uppercase MD5 hash
 */
const generatePayHereHash = (merchantId, orderId, amount, currency, merchantSecret) => {
  if (!merchantId || !orderId || !amount || !currency || !merchantSecret) {
    throw new Error('All parameters (merchantId, orderId, amount, currency, merchantSecret) are required for PayHere hash generation.');
  }

  const hashedSecret = crypto
    .createHash('md5')
    .update(merchantSecret.trim())
    .digest('hex')
    .toUpperCase();

  const amountFormatted = parseFloat(amount).toFixed(2);

  const hashString = `${merchantId.toString().trim()}${orderId.toString().trim()}${amountFormatted}${currency.trim()}${hashedSecret}`;

  return crypto
    .createHash('md5')
    .update(hashString)
    .digest('hex')
    .toUpperCase();
};

/**
 * Verify PayHere Instant Payment Notification (IPN) MD5 signature
 * Formula: strtoupper(md5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + strtoupper(md5(merchant_secret))))
 *
 * @param {string} merchantId
 * @param {string} orderId
 * @param {number|string} amount
 * @param {string} currency
 * @param {number|string} statusCode
 * @param {string} merchantSecret
 * @param {string} receivedSig
 * @returns {boolean} True if signature matches
 */
const verifyPayHereSignature = (merchantId, orderId, amount, currency, statusCode, merchantSecret, receivedSig) => {
  if (!merchantId || !orderId || !amount || !currency || statusCode === undefined || !merchantSecret || !receivedSig) {
    return false;
  }

  const hashedSecret = crypto
    .createHash('md5')
    .update(merchantSecret.trim())
    .digest('hex')
    .toUpperCase();

  const amountFormatted = parseFloat(amount).toFixed(2);

  const hashString = `${merchantId.toString().trim()}${orderId.toString().trim()}${amountFormatted}${currency.trim()}${statusCode.toString().trim()}${hashedSecret}`;

  const expectedSig = crypto
    .createHash('md5')
    .update(hashString)
    .digest('hex')
    .toUpperCase();

  return expectedSig === receivedSig.toString().trim().toUpperCase();
};

module.exports = {
  generatePayHereHash,
  verifyPayHereSignature,
};
