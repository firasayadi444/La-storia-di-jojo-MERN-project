const Orders = require("../models/orderModel");
const Users = require("../models/userModel");
const Foods = require("../models/foodModel");
const { makeOrderErrorHandler } = require("../utils/errorHandler");
const nodemailer = require("nodemailer");

const orderController = {
  makeOrder: async (req, res) => {
    try {
      const { items, totalAmount, deliveryAddress } = req.body;
      
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
        status: 'pending'
      }).save();

      // Populate food details for response
      await order.populate('items.food');
      await order.populate('user', 'name email');

      res.status(201).json({
        message: "Order placed successfully",
        order
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  getAllOrders: async (req, res) => {
    try {
      console.log('Getting all orders...'); // Debug log
      
      const orders = await Orders.find()
        .populate('user', 'name email')
        .populate('items.food', 'name price image category')
        .populate('deliveryMan', 'name phone')
        .sort({ createdAt: -1 });
      
      console.log(`Found ${orders.length} orders`); // Debug log
      
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
        .sort({ createdAt: -1 });
      
      res.status(200).json({ orders });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  getDeliveryOrders: async (req, res) => {
    try {
      const deliveryManId = req.user._id;
      const orders = await Orders.find({ 
        deliveryMan: deliveryManId,
        status: { $in: ['ready', 'out_for_delivery'] }
      })
        .populate('user', 'name email phone')
        .populate('items.food', 'name price image category')
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

      console.log('Updating order:', orderId, 'with data:', req.body); // Debug log

      const order = await Orders.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      console.log('Current order status:', order.status); // Debug log

      // Check if status is actually changing
      if (status === order.status && !deliveryManId && !estimatedDeliveryTime && !deliveryNotes) {
        return res.status(400).json({ 
          message: "No changes detected. Please update at least one field." 
        });
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

        // Check if current status exists in validTransitions
        if (!validTransitions[order.status]) {
          return res.status(400).json({ 
            message: `Invalid current order status: ${order.status}` 
          });
        }

        // Check if the transition is valid
        if (!validTransitions[order.status].includes(status)) {
          return res.status(400).json({ 
            message: `Invalid status transition from ${order.status} to ${status}. Valid transitions: ${validTransitions[order.status].join(', ')}` 
          });
        }
      }

      // Update order
      const updateData = {};
      let deliveryMan = null;
      
      // Only update status if it's different
      if (status !== order.status) {
        updateData.status = status;
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
        if (estimatedDeliveryTime) {
          updateData.estimatedDeliveryTime = new Date(estimatedDeliveryTime);
        }
      }

      if (status === 'delivered') {
        updateData.actualDeliveryTime = new Date();
        // Calculate 15% commission for delivery man
        if (order.deliveryMan) {
          updateData.deliveryEarnings = Math.round((order.totalAmount * 0.15) * 100) / 100; // 15% commission
        }
      }

      if (deliveryNotes) {
        updateData.deliveryNotes = deliveryNotes;
      }

      console.log('Final update data:', updateData); // Debug log

      const updatedOrder = await Orders.findByIdAndUpdate(
        orderId,
        updateData,
        { new: true }
      )
        .populate('user', 'name email')
        .populate('items.food', 'name price image category')
        .populate('deliveryMan', 'name phone email');

      // Send notification to delivery man if assigned
      if (status === 'out_for_delivery' && deliveryMan && process.env.SMTP_USER) {
        try {
          const transporter = nodemailer.createTransporter({
            service: 'gmail',
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          });

          const orderItems = updatedOrder.items.map(item => 
            `${item.food.name} x${item.quantity}`
          ).join(', ');

          await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: deliveryMan.email,
            subject: 'New Delivery Assignment - La Storia Di JoJo',
            html: `
              <h2>New Delivery Assignment</h2>
              <p>Hello ${deliveryMan.name},</p>
              <p>You have been assigned a new delivery order.</p>
              <h3>Order Details:</h3>
              <ul>
                <li><strong>Order ID:</strong> ${updatedOrder._id.slice(-6)}</li>
                <li><strong>Customer:</strong> ${updatedOrder.user.name}</li>
                <li><strong>Delivery Address:</strong> ${updatedOrder.deliveryAddress}</li>
                <li><strong>Items:</strong> ${orderItems}</li>
                <li><strong>Total Amount:</strong> €${updatedOrder.totalAmount.toFixed(2)}</li>
                ${updatedOrder.estimatedDeliveryTime ? `<li><strong>Estimated Delivery:</strong> ${new Date(updatedOrder.estimatedDeliveryTime).toLocaleString()}</li>` : ''}
              </ul>
              <p>Please check your delivery dashboard for more details.</p>
              <p>Thank you!</p>
            `
          });
          console.log(`Notification sent to delivery man: ${deliveryMan.email}`);
        } catch (emailError) {
          console.error('Failed to send delivery notification:', emailError);
        }
      }

      res.status(200).json({
        message: "Order updated successfully",
        order: updatedOrder
      });
    } catch (error) {
      console.error('Order status update error:', error); // Debug log
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
        .sort({ createdAt: -1 });
      res.status(200).json({ orders });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // Get delivery man earnings history by month
  getDeliveryEarnings: async (req, res) => {
    try {
      const deliveryManId = req.user._id;
      const orders = await Orders.find({
        deliveryMan: deliveryManId,
        status: 'delivered',
        deliveryEarnings: { $gt: 0 }
      })
        .populate('user', 'name email phone')
        .populate('items.food', 'name price image category')
        .sort({ createdAt: -1 });

      // Group earnings by month
      const earningsByMonth = {};
      orders.forEach(order => {
        const date = new Date(order.actualDeliveryTime || order.updatedAt);
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        const monthName = date.toLocaleString('default', { year: 'numeric', month: 'long' });
        
        if (!earningsByMonth[monthKey]) {
          earningsByMonth[monthKey] = {
            month: monthName,
            monthKey: monthKey,
            totalEarnings: 0,
            orderCount: 0,
            orders: []
          };
        }
        
        earningsByMonth[monthKey].totalEarnings += order.deliveryEarnings;
        earningsByMonth[monthKey].orderCount += 1;
        earningsByMonth[monthKey].orders.push({
          _id: order._id,
          orderNumber: order._id.slice(-6),
          customerName: order.user?.name,
          totalAmount: order.totalAmount,
          earnings: order.deliveryEarnings,
          deliveryDate: order.actualDeliveryTime || order.updatedAt
        });
      });

      // Convert to array and sort by month
      const earningsHistory = Object.values(earningsByMonth).sort((a, b) => 
        new Date(a.monthKey).getTime() - new Date(b.monthKey).getTime()
      );

      // Calculate total earnings
      const totalEarnings = earningsHistory.reduce((sum, month) => sum + month.totalEarnings, 0);
      const totalOrders = earningsHistory.reduce((sum, month) => sum + month.orderCount, 0);

      res.status(200).json({ 
        message: "Delivery earnings retrieved successfully",
        data: {
          earningsHistory,
          totalEarnings,
          totalOrders,
          orders
        }
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
};

module.exports = orderController;
