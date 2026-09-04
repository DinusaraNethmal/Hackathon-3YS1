const express = require('express');
const { body } = require('express-validator');
const {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getBookingsByBus,
  getAllBookings,
  verifyBookingTicket,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

// Public conductor / passenger ticket verification endpoint
router.get('/verify/:bookingId', verifyBookingTicket);

// Validation for creating booking
const bookingValidation = [
  body('busId').notEmpty().withMessage('Bus ID is required'),
  body('travelDate')
    .notEmpty()
    .withMessage('Travel date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Travel date must be in YYYY-MM-DD format')
    .custom((value) => {
      const today = new Date().toISOString().split('T')[0];
      if (value < today) {
        throw new Error('Travel date cannot be in the past');
      }
      return true;
    }),
  body('seats')
    .isArray({ min: 1, max: 6 })
    .withMessage('You can reserve between 1 and 6 seats per transaction'),
  body('passengerName').optional().trim(),
  body('passengerPhone').optional().trim(),
  body('passengerEmail').optional().isEmail().withMessage('Invalid passenger email address'),
];

// All booking routes require authentication
router.use(protect);

router.post('/', bookingValidation, createBooking);
router.get('/my', getMyBookings);
router.get('/bus/:busId', authorize('owner', 'admin'), getBookingsByBus);
router.get('/', authorize('admin'), getAllBookings);

router.get('/:id', getBookingById);
router.put('/:id/cancel', cancelBooking);

module.exports = router;

