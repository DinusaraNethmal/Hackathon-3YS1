const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: [true, 'Booking ID is required'],
      unique: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    busId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus',
      required: [true, 'Bus ID is required'],
    },
    travelDate: {
      type: String,
      required: [true, 'Travel date is required'],
      trim: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Travel date must be in YYYY-MM-DD format'],
    },
    seats: {
      type: [Number],
      required: [true, 'Seats are required'],
      validate: {
        validator: function (val) {
          if (!Array.isArray(val) || val.length === 0) return false;
          // Check for duplicates
          const uniqueSeats = new Set(val);
          return uniqueSeats.size === val.length;
        },
        message: 'Seats cannot be empty or contain duplicates',
      },
    },
    passengerCount: {
      type: Number,
      required: [true, 'Passenger count is required'],
      min: [1, 'Passenger count must be at least 1'],
    },
    farePerSeat: {
      type: Number,
      required: [true, 'Fare per seat is required'],
      min: [0, 'Fare per seat cannot be negative'],
    },
    totalFare: {
      type: Number,
      required: [true, 'Total fare is required'],
      min: [0, 'Total fare cannot be negative'],
    },
    passengerName: {
      type: String,
      trim: true,
    },
    passengerPhone: {
      type: String,
      trim: true,
    },
    passengerEmail: {
      type: String,
      trim: true,
    },
    paymentMethod: {
      type: String,
      default: 'WALLET',
    },
    status: {
      type: String,
      enum: {
        values: ['CONFIRMED', 'CANCELLED'],
        message: 'Status must be either CONFIRMED or CANCELLED',
      },
      default: 'CONFIRMED',
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Search indexes
bookingSchema.index({ busId: 1, travelDate: 1, status: 1 });
bookingSchema.index({ userId: 1 });

module.exports = mongoose.model('Booking', bookingSchema);

