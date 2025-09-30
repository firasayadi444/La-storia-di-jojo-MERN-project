const Orders = require("../models/orderModel");
const Users = require("../models/userModel");
const Foods = require("../models/foodModel");
const { makeOrderErrorHandler } = require("../utils/errorHandler");
const nodemailer = require("nodemailer");
const socketService = require("../services/socketService");
const { findNearestDeliveryPerson, calculateRealTimeETA, formatTimeEstimate } = require("../utils/distanceCalculator");

const orderController = {
  makeOrder: async (req, res) => {
    try {
      const { items, totalAmount, deliveryAddress, paymentMethod, customerLocation } = req.body;
      
      // Validate required fields
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Order must contain at least one item" });
      }
      
      if (!totalAmount || totalAmount <= 0) {
        return res.status(400).json({ message: "Invalid total amount" });
      }
      
      if (!deliveryAddress) {
        return res.status(400).json({ message: "Delivery address is required" });
      }

      // Validate customer location
      if (!customerLocation || !customerLocation.latitude || !customerLocation.longitude) {
        return res.status(400).json({ message: "Customer location is required for delivery tracking" });
      }

      // Debug logging for customer location
      console.log('Customer location received:', {
        latitude: customerLocation.latitude,
        longitude: customerLocation.longitude,
        accuracy: customerLocation.accuracy,
        type: typeof customerLocation.accuracy
      });

      // Validate and normalize accuracy
      let normalizedAccuracy = 10; // Default accuracy
      if (customerLocation.accuracy && typeof customerLocation.accuracy === 'number') {
        // If accuracy is reasonable (between 1m and 1000m), use it
        if (customerLocation.accuracy >= 1 && customerLocation.accuracy <= 1000) {
          normalizedAccuracy = Math.round(customerLocation.accuracy);
        } else {
          console.warn('Unusual accuracy value received:', customerLocation.accuracy, 'using default 10m');
        }
      }

      // Get user from token (req.user is set by auth middleware)
      const userId = req.user._id;

      // Validate that all food items exist
      for (const item of items) {
        const food = await Foods.findById(item.food);
        if (!food) {
          return res.status(400).json({ message: `Food item with ID ${item.food} not found` });
        }
      }

      // Create the order
      const order = await new Orders({
        user: userId,
        items,
        totalAmount,
        deliveryAddress,
        customerLocation: {
          latitude: customerLocation.latitude,
          longitude: customerLocation.longitude,
          accuracy: normalizedAccuracy,
          timestamp: new Date()
        },
        status: 'pending', // All orders start as pending, regardless of payment method
        // payment will be set when payment entity is created
      }).save();

      // Populate food details for response
      await order.populate('items.food');
      await order.populate('user', 'name email');

      // Emit WebSocket notification for new order
      const io = socketService.getIO();
      if (io) {
        const paymentInfo = paymentMethod === 'cash' ? ' (Cash on Delivery)' : ' (Card Payment)';
        
        io.to('admin').emit('new-order', {
          type: 'new-order',
          order,
          message: `New order #${order._id} received from ${order.user.name}${paymentInfo}`
        });
        
        io.to('delivery').emit('new-order', {
          type: 'new-order',
          order,
          message: `New order #${order._id} available for delivery${paymentInfo}`
        });
      } else {
      }

      // Try to automatically assign the nearest delivery person
      try {
        await orderController.autoAssignDeliveryPerson(order._id);
      } catch (assignError) {
        console.log('Auto-assignment failed, order will be assigned manually:', assignError.message);
      }

      res.status(201).json({
        message: "Order placed successfully",
        order
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // Auto-assign the nearest available delivery person
  autoAssignDeliveryPerson: async (orderId) => {
    try {
      const order = await Orders.findById(orderId).populate('user', 'name email phone');
      if (!order) {
        throw new Error('Order not found');
      }

      // Get all available delivery persons with location data
      const availableDeliveryPersons = await Users.find({
        role: 'delivery',
        status: 'active',
        isAvailable: true,
        currentLocation: { $exists: true, $ne: null }
      });

      if (availableDeliveryPersons.length === 0) {
        console.log('No available delivery persons found');
        return null;
      }

      // Find the nearest delivery person
      const nearestAssignment = findNearestDeliveryPerson(
        availableDeliveryPersons,
        order.customerLocation.latitude,
        order.customerLocation.longitude
      );

      if (!nearestAssignment) {
        console.log('No delivery person found within reasonable distance');
        return null;
      }

      const { deliveryPerson, distance, timeEstimate } = nearestAssignment;

      // Update the order with the assigned delivery person and time estimate
      const updatedOrder = await Orders.findByIdAndUpdate(
        orderId,
        {
          deliveryMan: deliveryPerson._id,
          estimatedDeliveryTime: timeEstimate.estimatedDeliveryTime,
          assignedAt: new Date()
        },
        { new: true }
      ).populate('deliveryMan', 'name email phone vehicleType');

      // Notify the assigned delivery person
      const io = socketService.getIO();
      if (io) {
        io.to(`delivery-${deliveryPerson._id}`).emit('delivery-assigned', {
          type: 'delivery-assigned',
          order: updatedOrder,
          distance: distance,
          timeEstimate: formatTimeEstimate(timeEstimate),
          message: `You have been assigned to deliver order #${orderId.slice(-8)}. Distance: ${Math.round(distance/1000)}km, ETA: ${formatTimeEstimate(timeEstimate).formattedTime}`
        });
      }

      console.log(`Auto-assigned delivery person ${deliveryPerson.name} to order ${orderId}. Distance: ${Math.round(distance/1000)}km`);
      
      return {
        deliveryPerson,
        distance,
        timeEstimate: formatTimeEstimate(timeEstimate)
      };
    } catch (error) {
      console.error('Error in auto-assignment:', error);
      throw error;
    }
  },

  // Get real-time ETA for an order
  getRealTimeETA: async (req, res) => {
    try {
      const { orderId } = req.params;
      const userId = req.user._id;
      const userRole = req.user.role;

      const order = await Orders.findById(orderId)
        .populate('user', 'name email phone')
        .populate('deliveryMan', 'name phone vehicleType currentLocation');

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Check permissions
      const isCustomer = String(order.user._id) === String(userId);
      const isDeliveryMan = order.deliveryMan && String(order.deliveryMan._id) === String(userId);
      const isAdmin = userRole === 'admin';

      if (!isCustomer && !isDeliveryMan && !isAdmin) {
        return res.status(403).json({ message: 'Access denied' });
      }

      if (!order.deliveryMan || !order.deliveryMan.currentLocation) {
        return res.status(400).json({ message: 'No delivery person assigned or location not available' });
      }

      // Calculate real-time ETA
      const timeEstimate = calculateRealTimeETA(order, order.deliveryMan, order.status);
      
      if (!timeEstimate) {
        return res.status(400).json({ message: 'Unable to calculate ETA' });
      }

      const formattedEstimate = formatTimeEstimate(timeEstimate);

      res.json({
        orderId: order._id,
        status: order.status,
        deliveryMan: {
          name: order.deliveryMan.name,
          phone: order.deliveryMan.phone,
          vehicleType: order.deliveryMan.vehicleType
        },
        timeEstimate: formattedEstimate,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Error getting real-time ETA:', error);
      res.status(500).json({ message: 'Failed to get ETA' });
    }
  },

  getAllOrders: async (req, res) => {
    try {
      
      const orders = await Orders.find()
        .populate('user', 'name email')
        .populate('items.food', 'name price image category')
        .populate('deliveryMan', 'name phone')
        .populate('payment')
        .sort({ createdAt: -1 });
      
      
      res.status(200).json({ 
        message: "Orders retrieved successfully",
        data: orders,
        orders: orders // Keep both for backward compatibility
      });
    } catch (error) {
      console.error('Error in getAllOrders:', error); // Debug log
      return res.status(500).json({ message: error.message });
    }
  },

  getUserOrders: async (req, res) => {
    try {
      const userId = req.user._id;
      const orders = await Orders.find({ user: userId })
        .populate('items.food', 'name price image category')
        .populate('deliveryMan', 'name phone')
        .populate('payment')
        .sort({ createdAt: -1 });
      
      console.log('📊 getUserOrders: Found orders:', orders.length);
      console.log('📊 getUserOrders: First order payment data:', orders[0] ? {
        orderId: orders[0]._id,
        payment: orders[0].payment,
        paymentStatus: orders[0].payment?.paymentStatus,
        paymentMethod: orders[0].payment?.paymentMethod
      } : 'No orders');
      
      res.status(200).json({ orders });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  getOrderCustomerLocation: async (req, res) => {
    try {
      const { orderId } = req.params;
      const userId = req.user._id;
      const userRole = req.user.role;

      // Find the order
      const order = await Orders.findById(orderId)
        .populate('user', 'name email phone')
        .populate('deliveryMan', 'name phone');

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Check permissions: user must be the customer, delivery person, or admin
      const isCustomer = String(order.user._id) === String(userId);
      const isDeliveryMan = order.deliveryMan && String(order.deliveryMan._id) === String(userId);
      const isAdmin = userRole === 'admin';

      if (!isCustomer && !isDeliveryMan && !isAdmin) {
        return res.status(403).json({ message: 'Access denied. You can only view location for your own orders or assigned deliveries.' });
      }

      // Return customer location if available
      if (!order.customerLocation) {
        return res.status(404).json({ message: 'Customer location not available for this order' });
      }

      res.status(200).json({
        message: 'Customer location retrieved successfully',
        orderId: order._id,
        customerLocation: order.customerLocation,
        customer: {
          name: order.user.name,
          phone: order.user.phone,
          email: order.user.email
        },
        deliveryAddress: order.deliveryAddress
      });
    } catch (error) {
      console.error('Error getting customer location:', error);
      return res.status(500).json({ message: 'Failed to retrieve customer location' });
    }
  },

  getDeliveryOrders: async (req, res) => {
    try {
      // Check if user is a delivery man
      if (req.user.role !== 'delivery') {
        return res.status(403).json({ message: "Access denied. Only delivery personnel can view delivery orders." });
      }

      const deliveryManId = req.user._id;
      const orders = await Orders.find({ 
        deliveryMan: deliveryManId,
        status: { $in: ['pending', 'ready', 'out_for_delivery'] }
      })
        .populate('user', 'name email phone')
        .populate('items.food', 'name price image category')
        .populate('payment')
        .sort({ createdAt: -1 });
      
      res.status(200).json({ orders });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  updateOrderStatus: async (req, res) => {
    try {
      const { status, deliveryManId, estimatedDeliveryTime, deliveryNotes } = req.body;
      const orderId = req.params.id;
      const userId = req.user._id;
      const userRole = req.user.role;

      console.log('=== Order Status Update Request ===');
      console.log('Order ID:', orderId);
      console.log('User ID:', userId);
      console.log('User Role:', userRole);
      console.log('Request Body:', req.body);
      console.log('Current User:', req.user);

      const order = await Orders.findById(orderId);
      if (!order) {
        console.log('Order not found');
        return res.status(404).json({ message: "Order not found" });
      }

      console.log('Current order status:', order.status);
      console.log('Order delivery man:', order.deliveryMan);
      console.log('Requested status:', status);

      // Check if status is actually changing
      if (status === order.status && !deliveryManId && !estimatedDeliveryTime && !deliveryNotes) {
        console.log('No changes detected');
        return res.status(400).json({ 
          message: "No changes detected. Please update at least one field." 
        });
      }

      // For delivery men, check if they are assigned to this order
      if (userRole === 'delivery') {
        console.log('Checking delivery man permissions...');
        if (!order.deliveryMan || String(order.deliveryMan) !== String(userId)) {
          console.log('Delivery man not assigned to this order');
          return res.status(403).json({ 
            message: "You are not assigned to this order or the order is not assigned to any delivery man." 
          });
        }
        console.log('Delivery man is authorized for this order');
      }

      // Validate status transition only if status is changing
      if (status !== order.status) {
        const validTransitions = {
          pending: ['confirmed', 'cancelled'],
          confirmed: ['preparing', 'cancelled'],
          preparing: ['ready', 'cancelled'],
          ready: ['out_for_delivery', 'cancelled'],
          out_for_delivery: ['delivered', 'cancelled'],
          delivered: [],
          cancelled: []
        };

        console.log('Valid transitions for current status:', validTransitions[order.status]);

        // Check if current status exists in validTransitions
        if (!validTransitions[order.status]) {
          console.log('Invalid current order status:', order.status);
          return res.status(400).json({ 
            message: `Invalid current order status: ${order.status}` 
          });
        }

        // Check if the transition is valid
        if (!validTransitions[order.status].includes(status)) {
          console.log('Invalid status transition');
          return res.status(400).json({ 
            message: `Invalid status transition from ${order.status} to ${status}. Valid transitions: ${validTransitions[order.status].join(', ')}` 
          });
        }

        console.log('Status transition is valid');
      }

      // Update order
      const updateData = {};
      let deliveryMan = null;
      
      // Only update status if it's different
      if (status !== order.status) {
        updateData.status = status;
        console.log('Updating status to:', status);
      }
      
      if (deliveryManId && (status === 'out_for_delivery' || status === 'ready')) {
        // Verify delivery man exists and is available
        deliveryMan = await Users.findById(deliveryManId);
        if (!deliveryMan) {
          return res.status(400).json({ message: "Delivery man not found" });
        }
        if (deliveryMan.role !== 'delivery') {
          return res.status(400).json({ message: "Selected user is not a delivery man" });
        }
        if (!deliveryMan.isAvailable) {
          return res.status(400).json({ message: "Selected delivery man is not available" });
        }
        updateData.deliveryMan = deliveryManId;
        if (status === 'ready') {
          updateData.assignedAt = new Date();
        }
        if (estimatedDeliveryTime) {
          updateData.estimatedDeliveryTime = new Date(estimatedDeliveryTime);
        }
      }

      if (status === 'delivered') {
        updateData.actualDeliveryTime = new Date();
        console.log('Setting actual delivery time');
        
        // Auto-confirm cash payment when order is marked as delivered
        // We need to populate the payment field first to check its properties
        if (order.payment) {
          const Payment = require('../models/paymentModel');
          const payment = await Payment.findById(order.payment);
          if (payment && payment.paymentMethod === 'cash' && payment.paymentStatus === 'pending') {
            // Update the payment status to paid
            await Payment.findByIdAndUpdate(order.payment, {
              paymentStatus: 'paid',
              paidAt: new Date()
            });
            console.log('Auto-confirmed cash payment for delivered order');
          }
        }
      }

      if (deliveryNotes) {
        updateData.deliveryNotes = deliveryNotes;
        console.log('Adding delivery notes');
      }

      console.log('Final update data:', updateData);

      const updatedOrder = await Orders.findByIdAndUpdate(
        orderId,
        updateData,
        { new: true }
      )
        .populate('user', 'name email')
        .populate('items.food', 'name price image category')
        .populate('deliveryMan', 'name phone email')
        .populate('payment', 'paymentMethod paymentStatus paidAt');

      console.log('Order updated successfully:', updatedOrder._id);

      // Emit WebSocket notifications for order status update
      const io = socketService.getIO();
      if (io) {
        // Notify the customer
        io.to(`user-${updatedOrder.user._id}`).emit('order-updated', {
          type: 'order-update',
          order: updatedOrder,
          message: `Your order #${updatedOrder._id} status has been updated to ${updatedOrder.status}`
        });

        // Notify delivery person if assigned
        if (updatedOrder.deliveryMan) {
          io.to(`delivery-${updatedOrder.deliveryMan._id}`).emit('order-updated', {
            type: 'order-update',
            order: updatedOrder,
            message: `Order #${updatedOrder._id} status updated to ${updatedOrder.status}`
          });
        }

        // Notify admin
        io.to('admin').emit('order-updated', {
          type: 'order-update',
          order: updatedOrder,
          message: `Order #${updatedOrder._id} status updated to ${updatedOrder.status} by ${userRole}`
        });

        // If delivery person was assigned, notify them
        if (deliveryManId && deliveryMan) {
          io.to(`delivery-${deliveryManId}`).emit('delivery-assigned', {
            type: 'delivery-assigned',
            order: updatedOrder,
            message: `You have been assigned to deliver order #${updatedOrder._id}`
          });
        }
      }

      res.status(200).json({
        message: "Order updated successfully",
        order: updatedOrder
      });
    } catch (error) {
      console.error('Order status update error:', error);
      return res.status(500).json({ message: error.message });
    }
  },

  deleteOrder: async (req, res) => {
    try {
      const order = await Orders.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      await order.deleteOne();
      res.status(200).json({ message: "Order deleted successfully" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  getAvailableDeliveryMen: async (req, res) => {
    try {
      console.log('Getting available delivery men...'); // Debug log
      
      const deliveryMen = await Users.find({
        role: 'delivery',
        isAvailable: true
      }).select('name phone currentLocation');
      
      console.log(`Found ${deliveryMen.length} available delivery men`); // Debug log
      
      res.status(200).json({ 
        message: "Available delivery men retrieved successfully",
        data: deliveryMen,
        deliveryMen: deliveryMen // Keep both for backward compatibility
      });
    } catch (error) {
      console.error('Error in getAvailableDeliveryMen:', error); // Debug log
      return res.status(500).json({ message: error.message });
    }
  },

  submitFeedback: async (req, res) => {
    try {
      const orderId = req.params.id;
      const { deliveryRating, foodRating, feedbackComment } = req.body;
      const userId = req.user._id;

      const order = await Orders.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      if (String(order.user) !== String(userId)) {
        return res.status(403).json({ message: "You are not authorized to submit feedback for this order." });
      }
      if (order.status !== 'delivered') {
        return res.status(400).json({ message: "You can only submit feedback for delivered orders." });
      }

      order.deliveryRating = deliveryRating;
      order.foodRating = foodRating;
      order.feedbackComment = feedbackComment;
      await order.save();

      res.status(200).json({ message: "Feedback submitted successfully", order });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // Get all feedbacks (orders with feedback)
  getAllFeedbacks: async (req, res) => {
    try {
      const feedbacks = await Orders.find({
        $or: [
          { feedbackComment: { $exists: true, $ne: null, $ne: '' } },
          { deliveryRating: { $exists: true, $ne: null } },
          { foodRating: { $exists: true, $ne: null } }
        ]
      })
        .populate('user', 'name email')
        .populate('deliveryMan', 'name email');
      res.status(200).json({ feedbacks });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // Get delivery man notifications (new assignments)
  getDeliveryNotifications: async (req, res) => {
    try {
      console.log('Getting delivery notifications...'); // Debug log
      console.log('User from request:', req.user); // Debug log
      
      const deliveryManId = req.user._id;
      console.log('Delivery man ID:', deliveryManId); // Debug log
      
      const notifications = await Orders.find({ 
        deliveryMan: deliveryManId,
        status: { $in: ['ready', 'out_for_delivery'] }
      })
        .populate('user', 'name email phone')
        .populate('items.food', 'name price image category')
        .sort({ createdAt: -1 })
        .limit(10); // Get last 10 notifications
      
      console.log(`Found ${notifications.length} notifications`); // Debug log
      
      res.status(200).json({ 
        message: "Delivery notifications retrieved successfully",
        data: notifications,
        notifications: notifications // Keep both for backward compatibility
      });
    } catch (error) {
      console.error('Error in getDeliveryNotifications:', error); // Debug log
      return res.status(500).json({ message: error.message });
    }
  },

  getDeliveryHistory: async (req, res) => {
    try {
      const deliveryManId = req.user._id;
      const orders = await Orders.find({
        deliveryMan: deliveryManId,
        status: 'delivered'
      })
        .populate('user', 'name email phone')
        .populate('items.food', 'name price image category')
        .populate('payment')
        .sort({ createdAt: -1 });
      res.status(200).json({ orders });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  getDeliveredOrders: async (req, res) => {
    try {
      const orders = await Orders.find({ status: 'delivered' })
        .populate('user', 'name email')
        .populate('items.food', 'name price image category')
        .populate('deliveryMan', 'name phone')
        .populate('payment');
      res.status(200).json({ orders });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // Get user notifications (order status changes)
  getUserNotifications: async (req, res) => {
    try {
      const userId = req.user._id;
      // Get recent orders for this user that are not delivered/cancelled
      const notifications = await Orders.find({
        user: userId,
        status: { $nin: ['delivered', 'cancelled'] }
      })
        .populate('items.food', 'name price image category')
        .sort({ updatedAt: -1 })
        .limit(10);
      res.status(200).json({
        message: 'User notifications retrieved successfully',
        data: notifications,
        notifications: notifications
      });
    } catch (error) {
      console.error('Error in getUserNotifications:', error);
      return res.status(500).json({ message: error.message });
    }
  },

  // Cancel order (user only, pending status only)
  cancelOrder: async (req, res) => {
    try {
      const { id: orderId } = req.params;
      const userId = req.user._id;

      console.log('=== Cancel Order Request ===');
      console.log('Order ID:', orderId);
      console.log('User ID:', userId);

      // Find the order
      const order = await Orders.findById(orderId)
        .populate('user', 'name email')
        .populate('items.food', 'name price');

      if (!order) {
        console.log('Order not found:', orderId);
        return res.status(404).json({ message: 'Order not found' });
      }

      console.log('Order found:', {
        id: order._id,
        status: order.status,
        paymentStatus: order.payment?.status,
        userId: order.user?._id
      });

      // Check if user owns the order
      if (!order.user || String(order.user._id) !== String(userId)) {
        console.log('Unauthorized: User', userId, 'trying to cancel order owned by', order.user?._id);
        return res.status(403).json({ message: 'Unauthorized to cancel this order' });
      }

      // Check if order is in pending status
      if (order.status !== 'pending') {
        return res.status(400).json({ 
          message: 'Order cannot be cancelled. Only pending orders can be cancelled.' 
        });
      }

      // Check if order is already paid (through payment entity)
      if (order.payment) {
        const Payment = require('../models/paymentModel');
        const payment = await Payment.findById(order.payment);
        if (payment && payment.paymentStatus === 'paid') {
          return res.status(400).json({ 
            message: 'Order cannot be cancelled. Payment has already been processed.' 
          });
        }
      }

      // Update order status to cancelled
      order.status = 'cancelled';
      order.cancelledAt = new Date();
      await order.save();

      console.log('Order successfully cancelled:', order._id);

      // Emit WebSocket notification (handle errors gracefully)
      try {
        const io = socketService.getIO();
        if (io) {
          // Notify customer
          console.log('🔔 Emitting order-updated event to customer:', order.user._id);
          io.to(`user-${order.user._id}`).emit('order-updated', {
            type: 'order-update',
            order,
            message: `Your order #${order._id.slice(-6)} has been cancelled`
          });

          // Notify admin
          console.log('🔔 Emitting order-updated event to admin room for cancellation');
          io.to('admin').emit('order-updated', {
            type: 'order-update',
            order,
            message: `Order #${order._id.slice(-6)} has been cancelled by customer`
          });

          // Notify delivery person if assigned
          if (order.deliveryMan) {
            console.log('🔔 Emitting order-updated event to delivery person:', order.deliveryMan._id);
            io.to(`delivery-${order.deliveryMan._id}`).emit('order-updated', {
              type: 'order-update',
              order,
              message: `Order #${order._id.slice(-6)} has been cancelled`
            });
          }
          console.log('✅ WebSocket notifications sent successfully for order cancellation');
        }
      } catch (wsError) {
        console.error('WebSocket notification error (non-critical):', wsError);
        // Don't fail the request if WebSocket fails
      }

      console.log('Sending success response for cancelled order:', order._id);
      
      // Ensure order is properly populated for response
      const responseOrder = await Orders.findById(order._id)
        .populate('user', 'name email')
        .populate('items.food', 'name price');
      
      res.json({
        message: 'Order cancelled successfully',
        order: responseOrder,
      });
    } catch (error) {
      console.error('Cancel order error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        orderId: req.params.id,
        userId: req.user?._id
      });
      res.status(500).json({ 
        message: 'Failed to cancel order',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },
};

module.exports = orderController;
