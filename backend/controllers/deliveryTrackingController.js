const Orders = require('../models/orderModel');
const Users = require('../models/userModel');
const Location = require('../models/locationModel');
const DeliveryHistory = require('../models/deliveryHistoryModel');
const routeService = require('../utils/routeService');
const { calculateDistance, estimateDeliveryTime } = require('../utils/distanceCalculator');
const socketService = require('../services/socketService');

const deliveryTrackingController = {
  /**
   * Start delivery tracking for an order
   * POST /api/delivery/:orderId/start
   */
  startDelivery: async (req, res) => {
    try {
      const { orderId } = req.params;
      const deliveryManId = req.user._id;

      // Verify user is a delivery person
      if (req.user.role !== 'delivery') {
        return res.status(403).json({ message: 'Only delivery personnel can start deliveries' });
      }

      // Find the order
      const order = await Orders.findById(orderId)
        .populate('user', 'name email phone')
        .populate('deliveryMan', 'name email phone');

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Check if order is ready for delivery
      if (!['ready', 'out_for_delivery'].includes(order.status)) {
        return res.status(400).json({ 
          message: `Order must be ready or out for delivery. Current status: ${order.status}` 
        });
      }

      // Restaurant coordinates (Tunis, Tunisia)
      const restaurantLocation = {
        latitude: 36.867238,
        longitude: 10.183467
      };

      // Customer location
      if (!order.customerLocation) {
        return res.status(400).json({ message: 'Customer location not available' });
      }

      // Calculate route from restaurant to customer
      const route = await routeService.calculateRoute(restaurantLocation, order.customerLocation);
      
      // Calculate ETA
      const eta = estimateDeliveryTime(route.distance, 25, 0); // 25 km/h average, no prep time

      // Update order status and assign delivery person
      const updatedOrder = await Orders.findByIdAndUpdate(
        orderId,
        {
          status: 'out_for_delivery',
          deliveryMan: deliveryManId,
          estimatedDeliveryTime: eta.estimatedDeliveryTime.toISOString(),
          assignedAt: new Date()
        },
        { new: true }
      ).populate('deliveryMan', 'name email phone');

      // Create delivery history entry
      const deliveryHistory = new DeliveryHistory({
        deliveryManId,
        orderId,
        customerId: order.user._id,
        pickupLocation: {
          latitude: restaurantLocation.latitude,
          longitude: restaurantLocation.longitude,
          address: 'Restaurant Location',
          timestamp: new Date()
        },
        deliveryLocation: {
          latitude: order.customerLocation.latitude,
          longitude: order.customerLocation.longitude,
          address: order.deliveryAddress,
          timestamp: new Date()
        },
        totalDistance: route.distance,
        totalTime: eta.totalTimeMinutes,
        averageSpeed: eta.averageSpeed,
        statusHistory: [{
          status: 'assigned',
          timestamp: new Date(),
          location: restaurantLocation,
          notes: 'Delivery started from restaurant'
        }]
      });

      await deliveryHistory.save();

      // Update delivery person's current location to restaurant
      await Location.create({
        userId: deliveryManId,
        latitude: restaurantLocation.latitude,
        longitude: restaurantLocation.longitude,
        address: 'Restaurant Location',
        accuracy: 10,
        isActive: true,
        timestamp: new Date()
      });

      // Update user's current location
      await Users.findByIdAndUpdate(deliveryManId, {
        currentLocation: {
          type: 'Point',
          coordinates: [restaurantLocation.longitude, restaurantLocation.latitude]
        }
      });

      // Emit WebSocket notification
      const io = socketService.getIO();
      if (io) {
        io.emit('delivery-started', {
          orderId: orderId,
          deliveryMan: updatedOrder.deliveryMan,
          estimatedDeliveryTime: eta.estimatedDeliveryTime.toISOString(),
          route: {
            distance: route.distance,
            duration: route.duration,
            geometry: route.geometry
          }
        });
      }

      res.json({
        message: 'Delivery started successfully',
        order: updatedOrder,
        route: {
          distance: route.distance,
          duration: route.duration,
          eta: eta.estimatedDeliveryTime,
          geometry: route.geometry
        },
        deliveryHistory: deliveryHistory._id
      });

    } catch (error) {
      console.error('Error starting delivery:', error);
      res.status(500).json({ message: 'Failed to start delivery' });
    }
  },

  /**
   * Update delivery person location
   * POST /api/delivery/:orderId/location
   */
  updateDeliveryLocation: async (req, res) => {
    try {
      const { orderId } = req.params;
      const { latitude, longitude, accuracy, speed, heading } = req.body;
      const deliveryManId = req.user._id;

      // Validate coordinates
      if (!latitude || !longitude) {
        return res.status(400).json({ message: 'Latitude and longitude are required' });
      }

      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return res.status(400).json({ message: 'Invalid coordinates' });
      }

      // Find the order
      const order = await Orders.findById(orderId)
        .populate('user', '_id')
        .populate('deliveryMan', '_id name');

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Verify this delivery person is assigned to this order
      if (order.deliveryMan._id.toString() !== deliveryManId) {
        return res.status(403).json({ message: 'Not authorized to update this delivery' });
      }

      // Create location entry
      const location = new Location({
        userId: deliveryManId,
        latitude,
        longitude,
        accuracy: accuracy || 10,
        speed: speed || 0,
        heading: heading || 0,
        isActive: true,
        timestamp: new Date()
      });

      await location.save();

      // Update user's current location
      await Users.findByIdAndUpdate(deliveryManId, {
        currentLocation: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        latestLocation: location._id
      });

      // Update delivery history with route point
      await DeliveryHistory.findOneAndUpdate(
        { orderId, deliveryManId },
        {
          $push: {
            routePoints: {
              latitude,
              longitude,
              timestamp: new Date(),
              accuracy: accuracy || 10,
              speed: speed || 0,
              heading: heading || 0
            }
          }
        }
      );

      // Calculate real-time ETA
      const customerLocation = order.customerLocation;
      const distance = calculateDistance(
        latitude, longitude,
        customerLocation.latitude, customerLocation.longitude
      );
      
      const eta = estimateDeliveryTime(distance, 25, 0);
      const realTimeETA = new Date(Date.now() + (eta.totalTimeMinutes * 60 * 1000));

      // Update order with real-time ETA
      await Orders.findByIdAndUpdate(orderId, {
        estimatedDeliveryTime: realTimeETA.toISOString()
      });

      // Emit WebSocket notifications
      const io = socketService.getIO();
      if (io) {
        // Emit location update
        io.emit('location-update', {
          orderId: orderId,
          location: {
            lat: latitude,
            lng: longitude
          },
          accuracy: accuracy || 10,
          speed: speed || 0,
          heading: heading || 0,
          timestamp: location.timestamp.toISOString()
        });

        // Emit ETA update
        io.emit('eta-update', {
          orderId: orderId,
          estimatedDeliveryTime: realTimeETA.toISOString(),
          remainingMinutes: eta.totalTimeMinutes,
          distance: Math.round(distance)
        });
      }

      res.json({
        message: 'Location updated successfully',
        location: {
          latitude,
          longitude,
          accuracy: accuracy || 10,
          timestamp: location.timestamp
        },
        eta: {
          estimatedDeliveryTime: realTimeETA,
          remainingMinutes: eta.totalTimeMinutes,
          distance: Math.round(distance)
        }
      });

    } catch (error) {
      console.error('Error updating delivery location:', error);
      res.status(500).json({ message: 'Failed to update location' });
    }
  },

  /**
   * Get delivery tracking information
   * GET /api/delivery/:orderId/tracking
   */
  getDeliveryTracking: async (req, res) => {
    try {
      const { orderId } = req.params;
      const userId = req.user._id;

      // Find the order
      const order = await Orders.findById(orderId)
        .populate('user', 'name email phone')
        .populate('deliveryMan', 'name email phone vehicleType');

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Check if user is authorized to view this order
      const isCustomer = order.user._id.toString() === userId;
      const isDeliveryMan = order.deliveryMan && order.deliveryMan._id.toString() === userId;
      const isAdmin = req.user.role === 'admin';

      if (!isCustomer && !isDeliveryMan && !isAdmin) {
        return res.status(403).json({ message: 'Not authorized to view this delivery' });
      }

      // Get delivery history
      const deliveryHistory = await DeliveryHistory.findOne({ orderId })
        .populate('deliveryManId', 'name phone vehicleType');

      // Get latest delivery person location
      let currentLocation = null;
      if (order.deliveryMan) {
        const latestLocation = await Location.findOne({
          userId: order.deliveryMan._id,
          isActive: true
        }).sort({ timestamp: -1 });

        if (latestLocation) {
          currentLocation = {
            latitude: latestLocation.latitude,
            longitude: latestLocation.longitude,
            accuracy: latestLocation.accuracy,
            timestamp: latestLocation.timestamp,
            speed: latestLocation.speed,
            heading: latestLocation.heading
          };
        }
      }

      // Calculate route if delivery is in progress
      let route = null;
      if (order.status === 'out_for_delivery' && currentLocation && order.customerLocation) {
        try {
          route = await routeService.calculateRoute(currentLocation, order.customerLocation);
        } catch (error) {
          console.error('Error calculating route:', error);
        }
      }

      // Get trajectory
      const trajectory = await Location.find({
        userId: order.deliveryMan?._id,
        isActive: true,
        timestamp: { $gte: order.assignedAt || order.createdAt }
      }).sort({ timestamp: 1 }).limit(100);

      res.json({
        order: {
          _id: order._id,
          status: order.status,
          deliveryAddress: order.deliveryAddress,
          customerLocation: order.customerLocation,
          estimatedDeliveryTime: order.estimatedDeliveryTime,
          actualDeliveryTime: order.actualDeliveryTime,
          deliveryNotes: order.deliveryNotes,
          assignedAt: order.assignedAt,
          createdAt: order.createdAt
        },
        deliveryMan: order.deliveryMan,
        currentLocation,
        route,
        trajectory: trajectory.map(loc => ({
          latitude: loc.latitude,
          longitude: loc.longitude,
          timestamp: loc.timestamp,
          accuracy: loc.accuracy,
          speed: loc.speed,
          heading: loc.heading
        })),
        deliveryHistory: deliveryHistory ? {
          totalDistance: deliveryHistory.totalDistance,
          totalTime: deliveryHistory.totalTime,
          averageSpeed: deliveryHistory.averageSpeed,
          statusHistory: deliveryHistory.statusHistory
        } : null
      });

    } catch (error) {
      console.error('Error getting delivery tracking:', error);
      res.status(500).json({ message: 'Failed to get delivery tracking information' });
    }
  },

  /**
   * Complete delivery
   * POST /api/delivery/:orderId/complete
   */
  completeDelivery: async (req, res) => {
    try {
      const { orderId } = req.params;
      const { deliveryNotes, deliveryRating } = req.body;
      const deliveryManId = req.user._id;

      // Find the order
      const order = await Orders.findById(orderId).populate('deliveryMan', '_id');

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Verify this delivery person is assigned to this order
      if (!order.deliveryMan || order.deliveryMan._id.toString() !== deliveryManId) {
        return res.status(403).json({ message: 'Not authorized to complete this delivery' });
      }

      // Update order status
      const updatedOrder = await Orders.findByIdAndUpdate(
        orderId,
        {
          status: 'delivered',
          actualDeliveryTime: new Date().toISOString(),
          deliveryNotes: deliveryNotes || order.deliveryNotes,
          deliveryRating: deliveryRating || order.deliveryRating
        },
        { new: true }
      ).populate('user', 'name email phone')
       .populate('deliveryMan', 'name email phone');

      // Update delivery history
      await DeliveryHistory.findOneAndUpdate(
        { orderId, deliveryManId },
        {
          $push: {
            statusHistory: {
              status: 'delivered',
              timestamp: new Date(),
              location: {
                latitude: order.customerLocation.latitude,
                longitude: order.customerLocation.longitude
              },
              notes: deliveryNotes || 'Delivery completed'
            }
          },
          deliveryNotes: deliveryNotes || '',
          deliveryRating: deliveryRating || null
        }
      );

      // Deactivate delivery person's location tracking
      await Location.updateMany(
        { userId: deliveryManId, isActive: true },
        { isActive: false }
      );

      // Emit WebSocket notification
      const io = socketService.getIO();
      if (io) {
        io.emit('delivery-completed', {
          orderId: orderId,
          actualDeliveryTime: updatedOrder.actualDeliveryTime,
          deliveryNotes: deliveryNotes || updatedOrder.deliveryNotes,
          deliveryRating: deliveryRating || updatedOrder.deliveryRating
        });
      }

      res.json({
        message: 'Delivery completed successfully',
        order: updatedOrder
      });

    } catch (error) {
      console.error('Error completing delivery:', error);
      res.status(500).json({ message: 'Failed to complete delivery' });
    }
  },

  /**
   * Get delivery person's active deliveries
   * GET /api/delivery/active
   */
  getActiveDeliveries: async (req, res) => {
    try {
      const deliveryManId = req.user._id;

      if (req.user.role !== 'delivery') {
        return res.status(403).json({ message: 'Only delivery personnel can access this endpoint' });
      }

      const activeDeliveries = await Orders.find({
        deliveryMan: deliveryManId,
        status: 'out_for_delivery'
      })
      .populate('user', 'name email phone')
      .populate('deliveryMan', 'name email phone')
      .sort({ assignedAt: -1 });

      res.json({
        deliveries: activeDeliveries
      });

    } catch (error) {
      console.error('Error getting active deliveries:', error);
      res.status(500).json({ message: 'Failed to get active deliveries' });
    }
  }
};

module.exports = deliveryTrackingController;
