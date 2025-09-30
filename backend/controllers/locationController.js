const Location = require('../models/locationModel');
const User = require('../models/userModel');

const locationController = {
  // Legacy method - kept for backward compatibility
  // Use delivery tracking endpoints for new implementations
  updateLocation: async (req, res) => {
    try {
      const { latitude, longitude, address, accuracy, altitude, speed, heading } = req.body;
      const userId = req.user._id;

      // Validate coordinates
      if (!latitude || !longitude) {
        return res.status(400).json({ message: 'Latitude and longitude are required' });
      }

      if (latitude < -90 || latitude > 90) {
        return res.status(400).json({ message: 'Invalid latitude. Must be between -90 and 90' });
      }

      if (longitude < -180 || longitude > 180) {
        return res.status(400).json({ message: 'Invalid longitude. Must be between -180 and 180' });
      }

      // Create new location entry
      const location = new Location({
        userId,
        latitude,
        longitude,
        address,
        accuracy,
        altitude,
        speed,
        heading,
        timestamp: new Date(),
        isActive: true
      });

      await location.save();

      // Update user's current location and latest location reference
      await User.findByIdAndUpdate(userId, {
        currentLocation: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        latestLocation: location._id
      });

      res.status(201).json({
        message: 'Location updated successfully',
        location
      });
    } catch (error) {
      console.error('Error updating location:', error);
      res.status(500).json({ message: 'Failed to update location' });
    }
  },

  // Get user's location history (legacy - use delivery tracking for new implementations)
  getUserLocations: async (req, res) => {
    try {
      const userId = req.user._id;
      const { page = 1, limit = 50, startDate, endDate, isActive } = req.query;

      const query = { userId };
      
      // Date range filter
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }

      // Active status filter
      if (isActive !== undefined) {
        query.isActive = isActive === 'true';
      }

      const locations = await Location.find(query)
        .sort({ timestamp: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Location.countDocuments(query);

      res.json({
        locations,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });
    } catch (error) {
      console.error('Error fetching user locations:', error);
      res.status(500).json({ message: 'Failed to fetch locations' });
    }
  },

  // Get current location of a user (legacy - use delivery tracking for new implementations)
  getCurrentLocation: async (req, res) => {
    try {
      const { userId } = req.params;
      const requestingUserId = req.user._id;

      // Check if user can access this location
      if (String(userId) !== String(requestingUserId) && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized to access this location' });
      }

      const user = await User.findById(userId)
        .populate('latestLocation')
        .select('name currentLocation latestLocation');

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        user: {
          _id: user._id,
          name: user.name,
          currentLocation: user.currentLocation,
          latestLocation: user.latestLocation
        }
      });
    } catch (error) {
      console.error('Error fetching current location:', error);
      res.status(500).json({ message: 'Failed to fetch current location' });
    }
  },

  // Get nearby delivery personnel (for order assignment)
  getNearbyDeliveryMen: async (req, res) => {
    try {
      const { latitude, longitude, maxDistance = 5000 } = req.query; // maxDistance in meters

      if (!latitude || !longitude) {
        return res.status(400).json({ message: 'Latitude and longitude are required' });
      }

      const nearbyDeliveryMen = await Location.aggregate([
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [parseFloat(longitude), parseFloat(latitude)]
            },
            distanceField: 'distance',
            maxDistance: parseInt(maxDistance),
            spherical: true,
            query: { isActive: true }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: '$user'
        },
        {
          $match: {
            'user.role': 'delivery',
            'user.isAvailable': true,
            'user.status': 'active'
          }
        },
        {
          $sort: { distance: 1 }
        },
        {
          $project: {
            _id: 1,
            latitude: 1,
            longitude: 1,
            timestamp: 1,
            distance: 1,
            user: {
              _id: 1,
              name: 1,
              phone: 1,
              vehicleType: 1
            }
          }
        }
      ]);

      res.json({ deliveryMen: nearbyDeliveryMen });
    } catch (error) {
      console.error('Error finding nearby delivery men:', error);
      res.status(500).json({ message: 'Failed to find nearby delivery personnel' });
    }
  },

  // DEPRECATED: Use delivery tracking endpoints instead
  // This method is kept for backward compatibility only
  getDeliveryTrajectory: async (req, res) => {
    try {
      const { deliveryManId } = req.params;
      const { orderId } = req.query;
      const userId = req.user._id;
      const userRole = req.user.role;

      // Check if user has permission to view this trajectory
      if (userRole === 'user') {
        // For users, check if they have an order with this delivery person
        const Orders = require('../models/orderModel');
        const order = await Orders.findOne({
          user: userId,
          deliveryMan: deliveryManId,
          status: { $in: ['out_for_delivery', 'delivered'] }
        });

        if (!order) {
          return res.status(403).json({ message: 'Unauthorized to view this trajectory' });
        }
      } else if (userRole === 'delivery' && deliveryManId !== userId) {
        return res.status(403).json({ message: 'Unauthorized to view this trajectory' });
      }

      // Build query for trajectory
      let query = { userId: deliveryManId, isActive: true };
      
      // If orderId is provided, filter by time range around order creation
      if (orderId) {
        const Orders = require('../models/orderModel');
        const order = await Orders.findById(orderId);
        if (order) {
          const orderTime = new Date(order.createdAt);
          const startTime = new Date(orderTime.getTime() - 2 * 60 * 60 * 1000); // 2 hours before order
          const endTime = new Date(orderTime.getTime() + 4 * 60 * 60 * 1000); // 4 hours after order
          
          query.timestamp = {
            $gte: startTime,
            $lte: endTime
          };
        }
      }

      // Get trajectory data
      const trajectory = await Location.find(query)
        .sort({ timestamp: 1 })
        .select('latitude longitude timestamp accuracy speed heading')
        .limit(100); // Limit to last 100 points

      res.json({
        message: 'Trajectory retrieved successfully (DEPRECATED - use delivery tracking endpoints)',
        trajectory
      });
    } catch (error) {
      console.error('Error getting delivery trajectory:', error);
      res.status(500).json({ message: 'Failed to get delivery trajectory' });
    }
  },

  // Get all locations (admin only)
  getAllLocations: async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { page = 1, limit = 50, userId, isActive } = req.query;

      const query = {};
      if (userId) query.userId = userId;
      if (isActive !== undefined) query.isActive = isActive === 'true';

      const locations = await Location.find(query)
        .populate('userId', 'name email role')
        .sort({ timestamp: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Location.countDocuments(query);

      res.json({
        locations,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });
    } catch (error) {
      console.error('Error fetching all locations:', error);
      res.status(500).json({ message: 'Failed to fetch locations' });
    }
  },

  // Deactivate old locations (cleanup)
  deactivateOldLocations: async (req, res) => {
    try {
      const { hoursOld = 24 } = req.body;

      const cutoffTime = new Date(Date.now() - hoursOld * 60 * 60 * 1000);

      const result = await Location.updateMany(
        { 
          timestamp: { $lt: cutoffTime },
          isActive: true 
        },
        { isActive: false }
      );

      res.json({
        message: `Deactivated ${result.modifiedCount} old locations`,
        deactivatedCount: result.modifiedCount
      });
    } catch (error) {
      console.error('Error deactivating old locations:', error);
      res.status(500).json({ message: 'Failed to deactivate old locations' });
    }
  },

  // Get location statistics
  getLocationStats: async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const stats = await Location.aggregate([
        {
          $group: {
            _id: '$isActive',
            count: { $sum: 1 }
          }
        }
      ]);

      const totalLocations = await Location.countDocuments();
      const activeLocations = await Location.countDocuments({ isActive: true });

      res.json({
        stats,
        totalLocations,
        activeLocations,
        inactiveLocations: totalLocations - activeLocations
      });
    } catch (error) {
      console.error('Error fetching location stats:', error);
      res.status(500).json({ message: 'Failed to fetch location statistics' });
    }
  },

  // Delete location
  deleteLocation: async (req, res) => {
    try {
      const { locationId } = req.params;
      const userId = req.user._id;

      const location = await Location.findById(locationId);
      if (!location) {
        return res.status(404).json({ message: 'Location not found' });
      }

      // Check authorization
      if (String(location.userId) !== String(userId) && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized to delete this location' });
      }

      await Location.findByIdAndDelete(locationId);

      res.json({ message: 'Location deleted successfully' });
    } catch (error) {
      console.error('Error deleting location:', error);
      res.status(500).json({ message: 'Failed to delete location' });
    }
  }
};

module.exports = locationController;
