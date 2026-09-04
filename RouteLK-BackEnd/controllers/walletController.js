const { validationResult } = require('express-validator');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const generateTransactionId = require('../utils/generateTransactionId');

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

module.exports = {
  getWalletDetails,
  topUpWallet,
  payWithWallet,
};
