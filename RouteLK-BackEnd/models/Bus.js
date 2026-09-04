const mongoose = require('mongoose');

const busSchema = new mongoose.Schema(
  {
    busNumber: {
      type: String,
      required: [true, 'Bus number is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    busType: {
      type: String,
      required: [true, 'Bus type is required'],
      enum: {
        values: ['AC', 'NON_AC'],
        message: 'Bus type must be either AC or NON_AC',
      },
    },
    operatorName: {
      type: String,
      required: [true, 'Operator name is required'],
      trim: true,
    },
    from: {
      type: String,
      required: [true, 'Departure location is required'],
      trim: true,
    },
    to: {
      type: String,
      required: [true, 'Destination is required'],
      trim: true,
      validate: {
        validator: function (value) {
          if (!this.from) return true;
          return value.trim().toLowerCase() !== this.from.trim().toLowerCase();
        },
        message: 'Destination cannot be the same as departure location',
      },
    },
    routeStops: {
      type: [String],
      default: [],
    },
    departureTime: {
      type: String,
      required: [true, 'Departure time is required'],
      trim: true,
    },
    arrivalTime: {
      type: String,
      required: [true, 'Arrival time is required'],
      trim: true,
    },
    fare: {
      type: Number,
      required: [true, 'Fare is required'],
      min: [1, 'Fare must be greater than 0'],
    },
    totalSeats: {
      type: Number,
      required: [true, 'Total seats is required'],
      min: [10, 'Total seats must be at least 10'],
      max: [60, 'Total seats cannot exceed 60'],
      validate: {
        validator: Number.isInteger,
        message: 'Total seats must be an integer',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner ID is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Search indexes
busSchema.index({ from: 1, to: 1 });
busSchema.index({ busType: 1 });
busSchema.index({ isActive: 1 });
busSchema.index({ ownerId: 1 });

module.exports = mongoose.model('Bus', busSchema);

