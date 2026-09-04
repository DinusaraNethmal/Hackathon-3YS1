const { validationResult } = require('express-validator');
const Bus = require('../models/Bus');
const Booking = require('../models/Booking');

// @desc    Get all active buses
// @route   GET /api/buses
// @access  Public
const getAllBuses = async (req, res, next) => {
  try {
    const filter = req.query.all === 'true' ? {} : { isActive: true };

    const buses = await Bus.find(filter)
      .populate('ownerId', 'name email phone')
      .sort({ createdAt: -1 });

    const formattedBuses = buses.map((bus) => ({
      id: bus._id,
      busNumber: bus.busNumber,
      operatorName: bus.operatorName,
      busType: bus.busType,
      from: bus.from,
      to: bus.to,
      routeStops: bus.routeStops,
      departureTime: bus.departureTime,
      arrivalTime: bus.arrivalTime,
      fare: bus.fare,
      totalSeats: bus.totalSeats,
      isActive: bus.isActive,
      owner: bus.ownerId,
      createdAt: bus.createdAt,
    }));

    res.status(200).json({
      success: true,
      count: formattedBuses.length,
      data: formattedBuses,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search buses
// @route   GET /api/buses/search
// @access  Public
const searchBuses = async (req, res, next) => {
  try {
    const { from, to, travelDate, busType, minFare, maxFare } = req.query;

    const query = { isActive: true };

    if (from) {
      query.from = new RegExp(`^${from.trim()}$`, 'i');
    }

    if (to) {
      query.to = new RegExp(`^${to.trim()}$`, 'i');
    }

    if (busType && busType.toUpperCase() !== 'ALL') {
      query.busType = busType.toUpperCase();
    }

    if (minFare || maxFare) {
      query.fare = {};
      if (minFare) query.fare.$gte = Number(minFare);
      if (maxFare) query.fare.$lte = Number(maxFare);
    }

    const buses = await Bus.find(query).sort({ departureTime: 1 });

    // Calculate seat availability for the requested travel date
    const busesWithSeats = await Promise.all(
      buses.map(async (bus) => {
        let bookedSeatCount = 0;

        if (travelDate) {
          const bookings = await Booking.find({
            busId: bus._id,
            travelDate,
            status: 'CONFIRMED',
          });

          const bookedSeatSet = new Set();
          bookings.forEach((b) => {
            b.seats.forEach((seat) => bookedSeatSet.add(seat));
          });
          bookedSeatCount = bookedSeatSet.size;
        }

        const availableSeats = Math.max(0, bus.totalSeats - bookedSeatCount);

        return {
          id: bus._id,
          busNumber: bus.busNumber,
          operatorName: bus.operatorName,
          busType: bus.busType,
          from: bus.from,
          to: bus.to,
          routeStops: bus.routeStops,
          departureTime: bus.departureTime,
          arrivalTime: bus.arrivalTime,
          fare: bus.fare,
          totalSeats: bus.totalSeats,
          availableSeats,
          travelDate: travelDate || null,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: busesWithSeats.length,
      data: busesWithSeats,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single bus
// @route   GET /api/buses/:id
// @access  Public
const getBusById = async (req, res, next) => {
  try {
    const bus = await Bus.findById(req.params.id).populate(
      'ownerId',
      'name email phone'
    );

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: bus._id,
        busNumber: bus.busNumber,
        operatorName: bus.operatorName,
        busType: bus.busType,
        from: bus.from,
        to: bus.to,
        routeStops: bus.routeStops,
        departureTime: bus.departureTime,
        arrivalTime: bus.arrivalTime,
        fare: bus.fare,
        totalSeats: bus.totalSeats,
        isActive: bus.isActive,
        owner: bus.ownerId,
        createdAt: bus.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get seat availability for a bus on a specific date
// @route   GET /api/buses/:id/seats
// @access  Public
const getBusSeatAvailability = async (req, res, next) => {
  try {
    const { travelDate } = req.query;

    if (!travelDate) {
      return res.status(400).json({
        success: false,
        message: 'travelDate query parameter is required (YYYY-MM-DD)',
      });
    }

    const bus = await Bus.findById(req.params.id);
    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found',
      });
    }

    // Find confirmed bookings for this bus on this date
    const bookings = await Booking.find({
      busId: bus._id,
      travelDate,
      status: 'CONFIRMED',
    });

    const bookedSeatsSet = new Set();
    bookings.forEach((b) => {
      b.seats.forEach((seat) => bookedSeatsSet.add(seat));
    });

    const bookedSeats = Array.from(bookedSeatsSet).sort((a, b) => a - b);
    const availableSeats = [];
    for (let i = 1; i <= bus.totalSeats; i++) {
      if (!bookedSeatsSet.has(i)) {
        availableSeats.push(i);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        busId: bus._id,
        busNumber: bus.busNumber,
        busType: bus.busType,
        travelDate,
        fare: bus.fare,
        totalSeats: bus.totalSeats,
        bookedSeats,
        availableSeats,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get buses owned by logged-in owner
// @route   GET /api/buses/owner/my-buses
// @access  Private (Owner only)
const getOwnerBuses = async (req, res, next) => {
  try {
    const buses = await Bus.find({ ownerId: req.user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: buses.length,
      data: buses,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new bus
// @route   POST /api/buses
// @access  Private (Owner only)
const createBus = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
      });
    }

    const {
      busNumber,
      busType,
      operatorName,
      from,
      to,
      routeStops,
      departureTime,
      arrivalTime,
      fare,
      totalSeats,
      isActive,
    } = req.body;

    const existingBus = await Bus.findOne({
      busNumber: busNumber.trim().toUpperCase(),
    });
    if (existingBus) {
      return res.status(400).json({
        success: false,
        message: 'A bus with this bus number already exists',
      });
    }

    const bus = await Bus.create({
      busNumber: busNumber.trim().toUpperCase(),
      busType,
      operatorName,
      from,
      to,
      routeStops: routeStops || [from, to],
      departureTime,
      arrivalTime,
      fare,
      totalSeats,
      isActive: isActive !== undefined ? isActive : true,
      ownerId: req.body.ownerId || req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Bus created successfully',
      data: bus,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a bus
// @route   PUT /api/buses/:id
// @access  Private (Owner of bus or Admin)
const updateBus = async (req, res, next) => {
  try {
    let bus = await Bus.findById(req.params.id);

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found',
      });
    }

    // Check ownership or admin
    if (
      req.user.role !== 'admin' &&
      bus.ownerId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this bus',
      });
    }

    // If busNumber is being changed, ensure uniqueness
    if (req.body.busNumber) {
      const formattedNumber = req.body.busNumber.trim().toUpperCase();
      if (formattedNumber !== bus.busNumber) {
        const existingBus = await Bus.findOne({ busNumber: formattedNumber });
        if (existingBus) {
          return res.status(400).json({
            success: false,
            message: 'A bus with this bus number already exists',
          });
        }
        req.body.busNumber = formattedNumber;
      }
    }

    // Update fields
    bus = await Bus.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Bus updated successfully',
      data: bus,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a bus
// @route   DELETE /api/buses/:id
// @access  Private (Owner of bus or Admin)
const deleteBus = async (req, res, next) => {
  try {
    const bus = await Bus.findById(req.params.id);

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found',
      });
    }

    // Check ownership or admin
    if (
      req.user.role !== 'admin' &&
      bus.ownerId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this bus',
      });
    }

    await Bus.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Bus deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllBuses,
  searchBuses,
  getBusById,
  getBusSeatAvailability,
  getOwnerBuses,
  createBus,
  updateBus,
  deleteBus,
};

