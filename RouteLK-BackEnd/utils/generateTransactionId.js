const WalletTransaction = require('../models/WalletTransaction');

/**
 * Generates a unique, sequential transaction reference ID (e.g. TXN-WLT-10001)
 */
const generateTransactionId = async () => {
  const count = await WalletTransaction.countDocuments();
  let candidateNumber = 10001 + count;
  let transactionId = `TXN-WLT-${candidateNumber}`;

  let exists = await WalletTransaction.findOne({ transactionId });
  let attempts = 1;
  while (exists) {
    transactionId = `TXN-WLT-${candidateNumber + attempts}`;
    exists = await WalletTransaction.findOne({ transactionId });
    attempts++;
  }

  return transactionId;
};

module.exports = generateTransactionId;
