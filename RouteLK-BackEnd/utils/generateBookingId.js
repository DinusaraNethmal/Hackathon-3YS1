const Booking = require('../models/Booking');

/**
 * Generates a sequential, human-readable booking ID (e.g. RLK-10001)
 */
const generateBookingId = async () => {
  const count = await Booking.countDocuments();
  let candidateNumber = 10001 + count;
  let bookingId = `RLK-${candidateNumber}`;

  // Fallback collision resolution to ensure absolute uniqueness
  let exists = await Booking.findOne({ bookingId });
  let attempts = 1;
  while (exists) {
    bookingId = `RLK-${candidateNumber + attempts}`;
    exists = await Booking.findOne({ bookingId });
    attempts++;
  }

  return bookingId;
};

module.exports = generateBookingId;

