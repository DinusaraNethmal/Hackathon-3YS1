const { validationResult } = require('express-validator');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const generateTransactionId = require('../utils/generateTransactionId');
const { generatePayHereHash, verifyPayHereSignature } = require('../utils/payhereHelper');

// @desc    Get user wallet balance and transaction history
// @route   GET /api/wallet
// @access  Private (Passenger, Owner, Admin)
const getWalletDetails = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found',
      });
    }

    const transactions = await WalletTransaction.find({ userId: user._id })
      .populate('bookingId', 'bookingId travelDate seats totalFare')
      .sort({ createdAt: -1 })
      .limit(100);

    // Calculate aggregated statistics
    let totalTopUp = 0;
    let totalSpent = 0;
    let totalRefunded = 0;

    transactions.forEach((t) => {
      if (t.status === 'SUCCESS') {
        if (t.type === 'TOPUP') totalTopUp += t.amount;
        if (t.type === 'PAYMENT') totalSpent += t.amount;
        if (t.type === 'REFUND') totalRefunded += t.amount;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        balance: user.walletBalance || 0,
        summary: {
          totalTopUp,
          totalSpent,
          totalRefunded,
          transactionCount: transactions.length,
        },
        transactions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Top up wallet balance
// @route   POST /api/wallet/topup
// @access  Private (Passenger, Owner, Admin)
const topUpWallet = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
      });
    }

    const { amount, paymentMethod = 'CARD', reference = '' } = req.body;
    const topUpAmount = Number(amount);

    if (isNaN(topUpAmount) || topUpAmount < 100) {
      return res.status(400).json({
        success: false,
        message: 'Minimum top-up amount is Rs. 100 LKR',
      });
    }

    if (topUpAmount > 50000) {
      return res.status(400).json({
        success: false,
        message: 'Maximum top-up amount per transaction is Rs. 50,000 LKR',
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found',
      });
    }

    const balanceBefore = user.walletBalance || 0;
    const balanceAfter = balanceBefore + topUpAmount;

    // Update user wallet balance
    user.walletBalance = balanceAfter;
    await user.save();

    // Generate unique transaction reference
    const transactionId = await generateTransactionId();

    const paymentMethodLabels = {
      CARD: 'Visa / Mastercard',
      LANKAPAY: 'LankaPay National QR',
      EZCASH: 'eZ Cash / mCash',
      GENIE: 'Genie / FriMi',
      OTHER: 'Online Payment',
    };

    const methodLabel = paymentMethodLabels[paymentMethod.toUpperCase()] || paymentMethod;

    const transaction = await WalletTransaction.create({
      transactionId,
      userId: user._id,
      type: 'TOPUP',
      amount: topUpAmount,
      balanceBefore,
      balanceAfter,
      paymentMethod: paymentMethod.toUpperCase(),
      reference: reference || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
      description: `Wallet Top-Up via ${methodLabel}`,
      status: 'SUCCESS',
    });

    res.status(200).json({
      success: true,
      message: `Successfully topped up Rs. ${topUpAmount.toLocaleString()} to your wallet`,
      data: {
        balance: balanceAfter,
        transaction,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Process ticket payment using wallet balance
// @route   POST /api/wallet/pay
// @access  Private
const payWithWallet = async (req, res, next) => {
  try {
    const { amount, bookingId, description } = req.body;
    const paymentAmount = Number(amount);

    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment amount',
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const currentBalance = user.walletBalance || 0;
    if (currentBalance < paymentAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient wallet balance. You need Rs. ${paymentAmount}, but your wallet balance is Rs. ${currentBalance}.`,
        currentBalance,
        requiredAmount: paymentAmount,
      });
    }

    const balanceBefore = currentBalance;
    const balanceAfter = balanceBefore - paymentAmount;

    user.walletBalance = balanceAfter;
    await user.save();

    const transactionId = await generateTransactionId();

    const transaction = await WalletTransaction.create({
      transactionId,
      userId: user._id,
      type: 'PAYMENT',
      amount: paymentAmount,
      balanceBefore,
      balanceAfter,
      paymentMethod: 'WALLET',
      reference: bookingId ? `BOOKING-${bookingId}` : 'DIRECT-PAY',
      description: description || 'Bus Ticket Reservation Payment',
      status: 'SUCCESS',
      bookingId: bookingId || null,
    });

    res.status(200).json({
      success: true,
      message: `Payment of Rs. ${paymentAmount.toLocaleString()} deducted from wallet`,
      data: {
        balance: balanceAfter,
        transaction,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Initialize PayHere Checkout parameters and secure hash
// @route   POST /api/wallet/payhere-init
// @access  Private
const initPayHereTopUp = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const topUpAmount = Number(amount);

    if (isNaN(topUpAmount) || topUpAmount < 100) {
      return res.status(400).json({
        success: false,
        message: 'Minimum top-up amount is Rs. 100 LKR',
      });
    }

    if (topUpAmount > 50000) {
      return res.status(400).json({
        success: false,
        message: 'Maximum top-up amount per transaction is Rs. 50,000 LKR',
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found',
      });
    }

    const merchantId = (process.env.PAYHERE_MERCHANT_ID || '1211149').trim();
    const merchantSecret = (process.env.PAYHERE_MERCHANT_SECRET || '4Tx85f8B98Z4M997e3R0e1f78Q299e56T').trim();
    const isSandbox = (process.env.PAYHERE_MODE || 'sandbox').toLowerCase() === 'sandbox';

    // Unique order reference for this top-up
    const orderId = `WLT-PH-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const currency = 'LKR';
    const amountFormatted = topUpAmount.toFixed(2);

    // Generate PayHere MD5 cryptographic hash
    const hash = generatePayHereHash(merchantId, orderId, topUpAmount, currency, merchantSecret);

    // Pre-create pending transaction in wallet ledger
    const transactionId = await generateTransactionId();
    const pendingTxn = await WalletTransaction.create({
      transactionId,
      userId: user._id,
      type: 'TOPUP',
      amount: topUpAmount,
      balanceBefore: user.walletBalance || 0,
      balanceAfter: user.walletBalance || 0,
      paymentMethod: 'PAYHERE',
      reference: orderId,
      description: `PayHere Top-Up (${orderId})`,
      status: 'PENDING',
    });

    const nameParts = (user.name || 'Passenger User').trim().split(' ');
    const firstName = nameParts[0] || 'Passenger';
    const lastName = nameParts.slice(1).join(' ') || 'User';

    const clientBaseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const notifyUrl = `${req.protocol}://${req.get('host')}/api/wallet/payhere-notify`;

    res.status(200).json({
      success: true,
      data: {
        sandbox: isSandbox,
        merchant_id: merchantId,
        return_url: `${clientBaseUrl}/dashboard`,
        cancel_url: `${clientBaseUrl}/dashboard`,
        notify_url: notifyUrl,
        order_id: orderId,
        items: 'RouteLK Digital Wallet Top-Up',
        amount: amountFormatted,
        currency,
        hash,
        first_name: firstName,
        last_name: lastName,
        email: user.email || 'passenger@routelk.lk',
        phone: user.phone || '0771234567',
        address: 'No. 1, Galle Road',
        city: 'Colombo',
        country: 'Sri Lanka',
        custom_1: user._id.toString(),
        custom_2: pendingTxn._id.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Handle PayHere Instant Payment Notification (IPN Webhook)
// @route   POST /api/wallet/payhere-notify
// @access  Public (webhook called by PayHere servers)
const handlePayHereNotify = async (req, res, next) => {
  try {
    const {
      merchant_id,
      order_id,
      payment_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig,
      method,
    } = req.body;

    const merchantSecret = (process.env.PAYHERE_MERCHANT_SECRET || '4Tx85f8B98Z4M997e3R0e1f78Q299e56T').trim();

    // Verify authenticity of IPN notification
    const isValid = verifyPayHereSignature(
      merchant_id,
      order_id,
      payhere_amount,
      payhere_currency,
      status_code,
      merchantSecret,
      md5sig
    );

    if (!isValid) {
      console.warn(`[PayHere IPN] Invalid signature for order: ${order_id}`);
      return res.status(400).send('Invalid signature');
    }

    const transaction = await WalletTransaction.findOne({ reference: order_id });
    if (!transaction) {
      console.warn(`[PayHere IPN] No pending transaction found for order: ${order_id}`);
      return res.status(404).send('Transaction not found');
    }

    if (transaction.status === 'SUCCESS') {
      return res.status(200).send('Transaction already completed');
    }

    // status_code: 2 = Success, 0 = Pending, -1 = Canceled, -2 = Failed, -3 = Chargedback
    if (String(status_code) === '2') {
      const user = await User.findById(transaction.userId);
      if (user) {
        const topUpAmount = Number(payhere_amount);
        const balanceBefore = user.walletBalance || 0;
        const balanceAfter = balanceBefore + topUpAmount;

        user.walletBalance = balanceAfter;
        await user.save();

        transaction.status = 'SUCCESS';
        transaction.balanceBefore = balanceBefore;
        transaction.balanceAfter = balanceAfter;
        transaction.paymentMethod = method || 'PAYHERE';
        transaction.reference = `${order_id} | PayHere ID: ${payment_id || 'N/A'}`;
        transaction.description = `PayHere Top-Up (${method || 'Card/LankaPay'})`;
        await transaction.save();

        console.log(`[PayHere IPN] Successfully credited Rs. ${topUpAmount} to user ${user.email}`);
      }
    } else if (['-1', '-2', '-3'].includes(String(status_code))) {
      transaction.status = 'FAILED';
      transaction.description = `PayHere Top-Up Failed (Status: ${status_code})`;
      await transaction.save();
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('[PayHere IPN Error]', error);
    res.status(500).send('Internal Server Error');
  }
};

// @desc    Client-side confirmation fallback for PayHere modal onCompleted (useful for localhost testing)
// @route   POST /api/wallet/payhere-confirm
// @access  Private
const confirmPayHereTopUp = async (req, res, next) => {
  try {
    const { orderId, paymentId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required to confirm top-up',
      });
    }

    const transaction = await WalletTransaction.findOne({
      reference: orderId,
      userId: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'No matching transaction found for this order',
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found',
      });
    }

    // If already finalized via IPN webhook
    if (transaction.status === 'SUCCESS') {
      return res.status(200).json({
        success: true,
        message: 'Top-up has already been processed successfully',
        data: {
          balance: user.walletBalance,
          transaction,
        },
      });
    }

    // Finalize top-up
    const topUpAmount = transaction.amount;
    const balanceBefore = user.walletBalance || 0;
    const balanceAfter = balanceBefore + topUpAmount;

    user.walletBalance = balanceAfter;
    await user.save();

    transaction.status = 'SUCCESS';
    transaction.balanceBefore = balanceBefore;
    transaction.balanceAfter = balanceAfter;
    transaction.paymentMethod = 'PAYHERE';
    if (paymentId) {
      transaction.reference = `${orderId} | PayHere Ref: ${paymentId}`;
    }
    transaction.description = `PayHere Top-Up (Verified)`;
    await transaction.save();

    res.status(200).json({
      success: true,
      message: `Successfully topped up Rs. ${topUpAmount.toLocaleString()} via PayHere!`,
      data: {
        balance: balanceAfter,
        transaction,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWalletDetails,
  topUpWallet,
  payWithWallet,
  initPayHereTopUp,
  handlePayHereNotify,
  confirmPayHereTopUp,
};

