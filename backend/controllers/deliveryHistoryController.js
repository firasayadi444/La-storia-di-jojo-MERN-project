const DeliveryHistory = require('../models/deliveryHistoryModel');
const Order = require('../models/orderModel');
const User = require('../models/userModel');

const deliveryHistoryController = {
  // Create delivery history entry
  createDeliveryHistory: async (req, res) => {
    try {
      const { orderId, pickupLocation, deliveryLocation } = req.body;
      const deliveryManId = req.user._id;

      // Verify the order exists and is assigned to this delivery person
      const order = await Order.findById(orderId)
        .populate('user', '_id name email phone')
        .populate('deliveryMan', '_id name');

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      if (order.deliveryMan._id.toString() !== deliveryManId.toString()) {
        return res.status(403).json({ message: 'Order not assigned to you' });
      }

      // Check if delivery history already exists
      const existingHistory = await DeliveryHistory.findOne({ orderId });
      if (existingHistory) {
        return res.status(400).json({ message: 'Delivery history already exists for this order' });
      }

      // Create delivery history
      const deliveryHistory = new DeliveryHistory({
        deliveryManId,
        orderId,
        customerId: order.user._id,
        pickupLocation,
        deliveryLocation,
        statusHistory: [{
          status: 'assigned',
          timestamp: new Date(),
          notes: 'Delivery assigned'
        }]
      });

      await deliveryHistory.save();

      res.status(201).json({
        message: 'Delivery history created successfully',
        deliveryHistory
      });
    } catch (error) {
      console.error('Error creating delivery history:', error);
      res.status(500).json({ message: 'Failed to create delivery history' });
    }
  },

  // Update delivery status
  updateDeliveryStatus: async (req, res) => {
    try {
      const { deliveryHistoryId, status, location, notes } = req.body;
      const deliveryManId = req.user._id;

      const deliveryHistory = await DeliveryHistory.findById(deliveryHistoryId);
      if (!deliveryHistory) {
        return res.status(404).json({ message: 'Delivery history not found' });
      }

      if (deliveryHistory.deliveryManId.toString() !== deliveryManId.toString()) {
        return res.status(403).json({ message: 'Unauthorized to update this delivery history' });
      }

      // Update status
      await deliveryHistory.updateStatus(
        status,
        location?.latitude,
        location?.longitude,
        notes
      );

      // Update corresponding order status
      if (status === 'delivered') {
        await Order.findByIdAndUpdate(deliveryHistory.orderId, {
          status: 'delivered',
          actualDeliveryTime: new Date()
        });
      }

      res.json({
        message: 'Delivery status updated successfully',
        deliveryHistory
      });
    } catch (error) {
      console.error('Error updating delivery status:', error);
      res.status(500).json({ message: 'Failed to update delivery status' });
    }
  },

  // Add route point
  addRoutePoint: async (req, res) => {
    try {
      const { deliveryHistoryId, latitude, longitude, accuracy, speed, heading } = req.body;
      const deliveryManId = req.user._id;

      const deliveryHistory = await DeliveryHistory.findById(deliveryHistoryId);
      if (!deliveryHistory) {
        return res.status(404).json({ message: 'Delivery history not found' });
      }

      if (deliveryHistory.deliveryManId.toString() !== deliveryManId.toString()) {
        return res.status(403).json({ message: 'Unauthorized to update this delivery history' });
      }

      // Add route point
      await deliveryHistory.addRoutePoint(latitude, longitude, accuracy, speed, heading);

      // Recalculate metrics
      deliveryHistory.calculateMetrics();
      await deliveryHistory.save();

      res.json({
        message: 'Route point added successfully',
        deliveryHistory
      });
    } catch (error) {
      console.error('Error adding route point:', error);
      res.status(500).json({ message: 'Failed to add route point' });
    }
  },

  // Get delivery history for a delivery person
  getDeliveryHistory: async (req, res) => {
    try {
      const deliveryManId = req.user._id;
      const { page = 1, limit = 10, status, startDate, endDate } = req.query;

      const query = { deliveryManId };
      
      if (status) {
        query['statusHistory.status'] = status;
      }
      
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const deliveryHistories = await DeliveryHistory.find(query)
        .populate('orderId', 'totalAmount items status')
        .populate('customerId', 'name email phone')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await DeliveryHistory.countDocuments(query);

      res.json({
        deliveryHistories,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });
    } catch (error) {
      console.error('Error fetching delivery history:', error);
      res.status(500).json({ message: 'Failed to fetch delivery history' });
    }
  },

  // Get delivery statistics
  getDeliveryStats: async (req, res) => {
    try {
      const deliveryManId = req.user._id;
      const { period = '30' } = req.query; // days

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period));

      const stats = await DeliveryHistory.aggregate([
        {
          $match: {
            deliveryManId: new require('mongoose').Types.ObjectId(deliveryManId),
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: null,
            totalDeliveries: { $sum: 1 },
            completedDeliveries: {
              $sum: { $cond: [{ $eq: ['$deliveredAt', null] }, 0, 1] }
            },
            averageRating: { $avg: '$deliveryRating' },
            totalDistance: { $sum: '$totalDistance' },
            totalTime: { $sum: '$totalTime' },
            averageSpeed: { $avg: '$averageSpeed' }
          }
        }
      ]);

      // Get recent deliveries
      const recentDeliveries = await DeliveryHistory.find({
        deliveryManId,
        createdAt: { $gte: startDate }
      })
        .populate('orderId', 'totalAmount status')
        .populate('customerId', 'name')
        .sort({ createdAt: -1 })
        .limit(5);

      res.json({
        stats: stats[0] || {
          totalDeliveries: 0,
          completedDeliveries: 0,
          averageRating: 0,
          totalDistance: 0,
          totalTime: 0,
          averageSpeed: 0
        },
        recentDeliveries
      });
    } catch (error) {
      console.error('Error fetching delivery stats:', error);
      res.status(500).json({ message: 'Failed to fetch delivery statistics' });
    }
  },

  // Get specific delivery history details
  getDeliveryHistoryDetails: async (req, res) => {
    try {
      const { deliveryHistoryId } = req.params;
      const deliveryManId = req.user._id;

      const deliveryHistory = await DeliveryHistory.findById(deliveryHistoryId)
        .populate('orderId', 'totalAmount items status deliveryAddress')
        .populate('customerId', 'name email phone')
        .populate('deliveryManId', 'name phone');

      if (!deliveryHistory) {
        return res.status(404).json({ message: 'Delivery history not found' });
      }

      if (deliveryHistory.deliveryManId._id.toString() !== deliveryManId.toString()) {
        return res.status(403).json({ message: 'Unauthorized to view this delivery history' });
      }

      res.json({ deliveryHistory });
    } catch (error) {
      console.error('Error fetching delivery history details:', error);
      res.status(500).json({ message: 'Failed to fetch delivery history details' });
    }
  }
};

module.exports = deliveryHistoryController;
