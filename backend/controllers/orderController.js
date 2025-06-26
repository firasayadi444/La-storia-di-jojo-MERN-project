const Orders = require("../models/orderModel");
const Users = require("../models/userModel");
const Foods = require("../models/foodModel");
const { makeOrderErrorHandler } = require("../utils/errorHandler");

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
      const orders = await Orders.find()
        .populate('user', 'name email')
        .populate('items.food', 'name price image category')
        .populate('deliveryMan', 'name phone')
        .sort({ createdAt: -1 });
      
      res.status(200).json({ orders });
    } catch (error) {
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

      // Validate status transition
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

      // Update order
      const updateData = { status };
      
      if (deliveryManId && status === 'out_for_delivery') {
        // Verify delivery man exists and is available
        const deliveryMan = await Users.findById(deliveryManId);
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
        .populate('deliveryMan', 'name phone');

      res.status(200).json({
        message: "Order status updated successfully",
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
      const deliveryMen = await Users.find({
        role: 'delivery',
        isAvailable: true
      }).select('name phone currentLocation');
      
      res.status(200).json({ deliveryMen });
    } catch (error) {
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
};

module.exports = orderController;
