const express = require('express');
const { body } = require('express-validator');
const {
  getWalletDetails,
  topUpWallet,
  payWithWallet,
  initPayHereTopUp,
  handlePayHereNotify,
  confirmPayHereTopUp,
} = require('../controllers/walletController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Public IPN webhook from PayHere payment gateway server
router.post('/payhere-notify', handlePayHereNotify);

// All passenger routes require JWT authentication
router.use(protect);

const topUpValidation = [
  body('amount')
    .notEmpty()
    .withMessage('Top-up amount is required')
    .isFloat({ min: 100, max: 50000 })
    .withMessage('Top-up amount must be between Rs. 100 and Rs. 50,000 LKR'),
  body('paymentMethod')
    .optional()
    .isIn(['CARD', 'LANKAPAY', 'EZCASH', 'GENIE', 'PAYHERE', 'GOOGLE_PAY', 'OTHER', 'card', 'lankapay', 'ezcash', 'genie', 'payhere', 'google_pay'])
    .withMessage('Invalid payment method selected'),
];

router.get('/', getWalletDetails);
router.post('/topup', topUpValidation, topUpWallet);
router.post('/pay', payWithWallet);


router.post('/payhere-init', initPayHereTopUp);
router.post('/payhere-confirm', confirmPayHereTopUp);

module.exports = router;
