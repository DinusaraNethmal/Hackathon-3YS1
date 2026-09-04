const express = require('express');
const { body } = require('express-validator');
const {
  getAllBuses,
  searchBuses,
  getBusById,
  getBusSeatAvailability,
  getOwnerBuses,
  createBus,
  updateBus,
  deleteBus,
} = require('../controllers/busController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

// Validation for bus creation
const busValidationRules = [
  body('busNumber')
    .trim()
    .notEmpty()
    .withMessage('Bus number is required'),
  body('busType')
    .isIn(['AC', 'NON_AC'])
    .withMessage('Bus type must be either AC or NON_AC'),
  body('operatorName')
    .trim()
    .notEmpty()
    .withMessage('Operator name is required'),
  body('from')
    .trim()
    .notEmpty()
    .withMessage('Departure location is required'),
  body('to')
    .trim()
    .notEmpty()
    .withMessage('Destination is required')
    .custom((val, { req }) => {
      if (
        req.body.from &&
        val.trim().toLowerCase() === req.body.from.trim().toLowerCase()
      ) {
        throw new Error('Destination cannot be the same as departure location');
      }
      return true;
    }),
  body('departureTime')
    .trim()
    .notEmpty()
    .withMessage('Departure time is required'),
  body('arrivalTime')
    .trim()
    .notEmpty()
    .withMessage('Arrival time is required'),
  body('fare')
    .isFloat({ min: 1 })
    .withMessage('Fare must be greater than 0'),
  body('totalSeats')
    .isInt({ min: 10, max: 60 })
    .withMessage('Total seats must be an integer between 10 and 60'),
];

// Specific routes before param :id
router.get('/', getAllBuses);
router.get('/search', searchBuses);
router.get('/owner/my-buses', protect, authorize('owner'), getOwnerBuses);

// Routes with :id
router.get('/:id', getBusById);
router.get('/:id/seats', getBusSeatAvailability);

// Protected mutation routes
router.post('/', protect, authorize('owner', 'admin'), busValidationRules, createBus);
router.put('/:id', protect, authorize('owner', 'admin'), updateBus);
router.delete('/:id', protect, authorize('owner', 'admin'), deleteBus);

module.exports = router;

