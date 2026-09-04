const User = require('../models/User');
const Bus = require('../models/Bus');
const Booking = require('../models/Booking');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin only)
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (Admin only)
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent deleting own admin account
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Admin cannot delete their own account',
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get system statistics
// @route   GET /api/admin/statistics
// @access  Private (Admin only)
const getAdminStatistics = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalPassengers,
      totalOwners,
      totalBuses,
      totalBookings,
      confirmedBookings,
      cancelledBookings,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'passenger' }),
      User.countDocuments({ role: 'owner' }),
      Bus.countDocuments(),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'CONFIRMED' }),
      Booking.countDocuments({ status: 'CANCELLED' }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalPassengers,
        totalOwners,
        totalBuses,
        totalBookings,
        confirmedBookings,
        cancelledBookings,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  deleteUser,
  getAdminStatistics,
};

