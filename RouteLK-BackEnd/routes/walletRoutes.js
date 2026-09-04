const express = require('express');
const { body } = require('express-validator');
const {
  getWalletDetails,
  topUpWallet,
  payWithWallet,
} = require('../controllers/walletController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All wallet routes require authentication
router.use(protect);

const topUpValidation = [
  body('amount')
    .notEmpty()
    .withMessage('Top-up amount is required')
    .isFloat({ min: 100, max: 50000 })
    .withMessage('Top-up amount must be between Rs. 100 and Rs. 50,000 LKR'),
  body('paymentMethod')
    .optional()
    .isIn(['CARD', 'LANKAPAY', 'EZCASH', 'GENIE', 'OTHER', 'card', 'lankapay', 'ezcash', 'genie'])
    .withMessage('Invalid payment method selected'),
];

router.get('/', getWalletDetails);
router.post('/topup', topUpValidation, topUpWallet);
router.post('/pay', payWithWallet);

module.exports = router;
