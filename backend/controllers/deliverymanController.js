const mongoose = require("mongoose");
const Users = require('../models/userModel');
const Orders = require('../models/orderModel');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const socketService = require('../services/socketService');
const { calculateDistance, calculateRealTimeETA, formatTimeEstimate } = require('../utils/distanceCalculator');

const deliverymanController = {
  // Submit new deliveryman application
  apply: async (req, res) => {
    try {
      const { name, email, phone, vehicleType } = req.body;
      const vehiclePhoto = req.files?.vehiclePhoto?.[0]?.filename || '';
      const facePhoto = req.files?.facePhoto?.[0]?.filename || '';
      const cinPhoto = req.files?.cinPhoto?.[0]?.filename || '';

      if (!name || !email) {
        return res.status(400).json({ message: 'Name and email are required.' });
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Please enter a valid email address.' });
      }

      const existing = await Users.findOne({ email });
      if (existing) {
        return res.status(400).json({ message: 'Email already in use.' });
      }

      const user = new Users({
        name,
        email,
        phone: phone || '',
        role: 'delivery',
        status: 'pending',
        vehicleType: vehicleType || 'Not specified',
        vehiclePhoto,
        facePhoto,
        cinPhoto,
      });

      await user.save();
      res.status(201).json({ message: 'Application submitted successfully. You will be notified after acceptance.' });
    } catch (error) {
      console.error('Deliveryman application error:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // List all pending deliveryman applications
  listPending: async (req, res) => {
    try {
      const pending = await Users.find({ role: 'delivery', status: 'pending' });
      res.json({ message: "Pending applications retrieved successfully", data: pending });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Approve a deliveryman application
  approve: async (req, res) => {
    try {
      const { id } = req.params;
      const user = await Users.findById(id);

      if (!user || user.role !== 'delivery' || user.status !== 'pending') {
        return res.status(404).json({ message: 'Application not found.' });
      }

      // Generate password and update status
      const plainPassword = crypto.randomBytes(8).toString('hex');
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      user.password = hashedPassword;
      user.status = 'active';
      user.mustChangePassword = true;

      await user.save();

      // Send email if SMTP is configured
      if (process.env.MAIL_USER && process.env.MAIL_PASSWORD) {
        try {
          const transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.MAIL_PORT || '587'),
            secure: false,
            auth: {
              user: process.env.MAIL_USER,
              pass: process.env.MAIL_PASSWORD,
            },
          });

          await transporter.sendMail({
            from: `"Food Delivery App" <${process.env.MAIL_USER}>`,
            to: user.email,
            subject: 'Delivery Man Application Approved',
            text: `Hello ${user.name},\n\nYour delivery application has been approved!\n\nLogin Email: ${user.email}\nTemporary Password: ${plainPassword}\n\nPlease change your password after your first login.\n\nThank you.`,
          });

          console.log(`✅ Email sent to ${user.email}`);
        } catch (emailError) {
          console.error('❌ Failed to send email:', emailError);
        }
      } else {
        console.log(`⚠️ SMTP not configured. Manual password for ${user.email}: ${plainPassword}`);
      }

      // Emit WebSocket notification
      const io = socketService.getIO();
      if (io) {
        io.to(`user-${user._id}`).emit('application-updated', {
          type: 'application-updated',
          application: user,
          status: 'approved',
          message: `Your delivery application has been approved! Check your email for login credentials.`
        });

        io.to('admin').emit('application-updated', {
          type: 'application-updated',
          application: user,
          status: 'approved',
          message: `Delivery application approved for ${user.name}`
        });
      }

      res.json({
        message: 'Delivery man approved successfully.',
        email: user.email,
        password: plainPassword, // For admin manual notification
      });

    } catch (error) {
      console.error('❌ Approval error:', error);
      res.status(500).json({ message: 'Internal server error.' });
    }
  },

  // Reject a deliveryman application
  reject: async (req, res) => {
    try {
      const { id } = req.params;
      const user = await Users.findById(id);

      if (!user || user.role !== 'delivery' || user.status !== 'pending') {
        return res.status(404).json({ message: 'Application not found.' });
      }

      user.status = 'rejected';
      await user.save();

      // Emit WebSocket notification
      const io = socketService.getIO();
      if (io) {
        io.to(`user-${user._id}`).emit('application-updated', {
          type: 'application-updated',
          application: user,
          status: 'rejected',
          message: `Your delivery application has been rejected.`
        });

        io.to('admin').emit('application-updated', {
          type: 'application-updated',
          application: user,
          status: 'rejected',
          message: `Delivery application rejected for ${user.name}`
        });
      }

      res.json({ message: 'Application rejected.' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // List all deliverymen
  listAll: async (req, res) => {
    try {
      const deliverymen = await Users.find({ role: 'delivery' });
      res.json({ message: "All delivery men retrieved successfully", data: deliverymen });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Get one delivery man by ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const user = await Users.findById(id);

      if (!user || user.role !== 'delivery') {
        return res.status(404).json({ message: 'Delivery man not found.' });
      }

      res.json({ message: "Delivery man retrieved successfully", data: user });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Delete delivery man by ID
  deleteById: async (req, res) => {
    try {
      const { id } = req.params;
      const user = await Users.findById(id);

      if (!user || user.role !== 'delivery') {
        return res.status(404).json({ message: 'Delivery man not found.' });
      }

      await user.deleteOne();
      res.json({ message: 'Delivery man deleted successfully.' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Update delivery man availability
  updateAvailability: async (req, res) => {
    try {
      const { isAvailable } = req.body;
      const deliveryManId = req.user._id;

      if (typeof isAvailable !== 'boolean') {
        return res.status(400).json({ message: 'isAvailable must be a boolean value.' });
      }

      const user = await Users.findById(deliveryManId);
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }
      
      if (user.role !== 'delivery') {
        return res.status(403).json({ message: 'Access denied. Only delivery personnel can update availability.' });
      }

      // Check if delivery man is trying to go unavailable while having active orders
      if (!isAvailable) {
        const activeOrders = await Orders.find({
          deliveryMan: deliveryManId,
          status: { $in: ['ready', 'out_for_delivery'] }
        });

        if (activeOrders.length > 0) {
          return res.status(400).json({ 
            message: 'Cannot go unavailable while you have active deliveries. Please complete or cancel your current deliveries first.',
            activeOrdersCount: activeOrders.length
          });
        }
      }

      user.isAvailable = isAvailable;
      await user.save();

      res.json({ 
        message: `Availability updated successfully. You are now ${isAvailable ? 'available' : 'unavailable'}.`,
        isAvailable: user.isAvailable
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Update delivery person location with enhanced features
  updateLocation: async (req, res) => {
    try {
      const { latitude, longitude, accuracy, speed, heading, altitude, altitudeAccuracy } = req.body;
      const deliveryManId = req.user._id;

      // Validate location data
      if (!latitude || !longitude) {
        return res.status(400).json({ message: 'Latitude and longitude are required' });
      }

      if (latitude < -90 || latitude > 90) {
        return res.status(400).json({ message: 'Invalid latitude. Must be between -90 and 90' });
      }

      if (longitude < -180 || longitude > 180) {
        return res.status(400).json({ message: 'Invalid longitude. Must be between -180 and 180' });
      }

      // Validate accuracy (should be reasonable)
      if (accuracy && (accuracy < 0 || accuracy > 1000)) {
        return res.status(400).json({ message: 'Invalid accuracy value' });
      }

      // Update delivery person's current location with enhanced data
      const updateData = {
        'currentLocation.coordinates': [longitude, latitude], // GeoJSON format: [lng, lat]
        'currentLocation.accuracy': accuracy || 10,
        'currentLocation.speed': speed || 0,
        'currentLocation.heading': heading || 0,
        'currentLocation.lastUpdated': new Date()
      };

      // Add altitude data if available
      if (altitude !== undefined) {
        updateData['currentLocation.altitude'] = altitude;
        updateData['currentLocation.altitudeAccuracy'] = altitudeAccuracy || null;
      }

      const user = await Users.findByIdAndUpdate(
        deliveryManId,
        {
          $set: updateData
        },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ message: 'Delivery person not found' });
      }

      // Get all active orders for this delivery person
      const activeOrders = await Orders.find({
        deliveryMan: deliveryManId,
        status: { $in: ['out_for_delivery', 'ready'] }
      }).populate('user', '_id name email phone');

      // Broadcast location update to customers with enhanced data
      const io = socketService.getIO();
      if (io) {
        const locationData = {
          latitude,
          longitude,
          accuracy: accuracy || 10,
          speed: speed || 0,
          heading: heading || 0,
          altitude: altitude || null,
          altitudeAccuracy: altitudeAccuracy || null,
          timestamp: new Date().toISOString()
        };

        activeOrders.forEach(order => {
          // Emit enhanced location update to customer
          io.to(`user-${order.user._id}`).emit('delivery-location-update', {
            orderId: order._id,
            location: locationData,
            deliveryManId: deliveryManId,
            updateType: 'manual'
          });

          // Calculate and broadcast ETA update
          const etaUpdate = calculateRealTimeETA(order, user, order.status);
          if (etaUpdate) {
            const formattedETA = formatTimeEstimate(etaUpdate);
            io.to(`user-${order.user._id}`).emit('eta-update', {
              orderId: order._id,
              estimatedDeliveryTime: etaUpdate.estimatedDeliveryTime,
              remainingMinutes: formattedETA.remainingMinutes,
              distance: etaUpdate.distanceKm,
              formattedTime: formattedETA.formattedTime
            });
          }
        });

        // Also broadcast to admin for monitoring
        io.to('admin').emit('delivery-location-update', {
          deliveryManId: deliveryManId,
          location: locationData,
          activeOrdersCount: activeOrders.length,
          updateType: 'manual'
        });
      }

      res.json({
        message: 'Location updated successfully',
        location: {
          latitude,
          longitude,
          accuracy: accuracy || 10,
          speed: speed || 0,
          heading: heading || 0,
          lastUpdated: new Date()
        },
        activeOrdersCount: activeOrders.length
      });

    } catch (error) {
      console.error('Location update error:', error);
      res.status(500).json({ message: 'Failed to update location' });
    }
  },

  // Get order tracking data
  getOrderTracking: async (req, res) => {
    try {
      const { orderId } = req.params;
      const deliveryManId = req.user._id;

      // Find the order and verify delivery person has access
      const order = await Orders.findOne({
        _id: orderId,
        deliveryMan: deliveryManId
      }).populate('user', '_id name email phone');

      if (!order) {
        return res.status(404).json({ message: 'Order not found or you are not assigned to this order' });
      }

      // Get delivery person's current location
      const deliveryPerson = await Users.findById(deliveryManId, 'currentLocation name phone vehicleType');

      // Calculate current distance and ETA
      let trackingData = {
        order: {
          _id: order._id,
          status: order.status,
          customerLocation: order.customerLocation,
          deliveryAddress: order.deliveryAddress,
          estimatedDeliveryTime: order.estimatedDeliveryTime,
          createdAt: order.createdAt
        },
        customer: order.user,
        deliveryPerson: {
          _id: deliveryPerson._id,
          name: deliveryPerson.name,
          phone: deliveryPerson.phone,
          vehicleType: deliveryPerson.vehicleType,
          currentLocation: deliveryPerson.currentLocation
        }
      };

      // Calculate distance and ETA if both locations are available
      if (order.customerLocation && deliveryPerson.currentLocation && deliveryPerson.currentLocation.coordinates) {
        const [deliveryLng, deliveryLat] = deliveryPerson.currentLocation.coordinates;
        const distance = calculateDistance(
          order.customerLocation.latitude,
          order.customerLocation.longitude,
          deliveryLat,
          deliveryLng
        );

        const etaUpdate = calculateRealTimeETA(order, deliveryPerson, order.status);
        const formattedETA = formatTimeEstimate(etaUpdate);

        trackingData.distance = {
          meters: Math.round(distance),
          kilometers: Math.round(distance / 1000 * 100) / 100
        };

        trackingData.eta = formattedETA;
      }

      res.json(trackingData);

    } catch (error) {
      console.error('Get order tracking error:', error);
      res.status(500).json({ message: 'Failed to get order tracking data' });
    }
  },

  // Update delivery status
  updateDeliveryStatus: async (req, res) => {
    try {
      const { orderId, status, notes, location } = req.body;
      const deliveryManId = req.user._id;

      // Validate status
      const validStatuses = ['picked_up', 'in_transit', 'delivered', 'failed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status. Must be one of: ' + validStatuses.join(', ') });
      }

      // Find the order and verify delivery person has access
      const order = await Orders.findOne({
        _id: orderId,
        deliveryMan: deliveryManId
      }).populate('user', '_id name email phone');

      if (!order) {
        return res.status(404).json({ message: 'Order not found or you are not assigned to this order' });
      }

      // Update order status based on delivery status
      let orderStatus = order.status;
      let actualDeliveryTime = order.actualDeliveryTime;

      switch (status) {
        case 'picked_up':
          orderStatus = 'out_for_delivery';
          break;
        case 'in_transit':
          orderStatus = 'out_for_delivery';
          break;
        case 'delivered':
          orderStatus = 'delivered';
          actualDeliveryTime = new Date();
          break;
        case 'failed':
          orderStatus = 'cancelled';
          break;
      }

      // Update order
      const updatedOrder = await Orders.findByIdAndUpdate(
        orderId,
        {
          status: orderStatus,
          actualDeliveryTime: actualDeliveryTime,
          deliveryNotes: notes || order.deliveryNotes
        },
        { new: true }
      ).populate('user', '_id name email phone')
       .populate('deliveryMan', '_id name phone vehicleType currentLocation');

      // Update delivery person's location if provided
      if (location && location.latitude && location.longitude) {
        await Users.findByIdAndUpdate(deliveryManId, {
          $set: {
            'currentLocation.coordinates': [location.longitude, location.latitude],
            'currentLocation.accuracy': location.accuracy || 10,
            'currentLocation.lastUpdated': new Date()
          }
        });
      }

      // Broadcast status update to customer
      const io = socketService.getIO();
      if (io) {
        io.to(`user-${order.user._id}`).emit('order-updated', {
          order: updatedOrder
        });

        io.to(`user-${order.user._id}`).emit('delivery-update', {
          orderId: orderId,
          status: orderStatus,
          deliveryNotes: notes,
          actualDeliveryTime: actualDeliveryTime,
          location: location
        });

        // Notify admins
        io.to('admin').emit('delivery-status-update', {
          orderId: orderId,
          status: orderStatus,
          deliveryMan: deliveryManId,
          customer: order.user._id,
          timestamp: new Date()
        });
      }

      res.json({
        message: 'Delivery status updated successfully',
        order: updatedOrder,
        deliveryStatus: status
      });

    } catch (error) {
      console.error('Update delivery status error:', error);
      res.status(500).json({ message: 'Failed to update delivery status' });
    }
  }
};

module.exports = deliverymanController;
