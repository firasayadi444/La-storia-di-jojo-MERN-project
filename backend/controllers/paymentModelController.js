const Payment = require('../models/paymentModel');
const Order = require('../models/orderModel');
const User = require('../models/userModel');

const paymentController = {
  // Create a new payment
  createPayment: async (req, res) => {
    try {
      const { orderId, amount, paymentMethod, stripePaymentId } = req.body;
      const userId = req.user._id;

      // Validate order exists and belongs to user
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      if (String(order.user) !== String(userId)) {
        return res.status(403).json({ message: 'Unauthorized to create payment for this order' });
      }

      // Check if payment already exists for this order
      const existingPayment = await Payment.findOne({ orderId });
      if (existingPayment) {
        return res.status(400).json({ message: 'Payment already exists for this order' });
      }

      const payment = new Payment({
        userId,
        orderId,
        amount,
        paymentMethod,
        stripePaymentId,
        paymentStatus: 'pending'
      });

      await payment.save();

      // Update order with payment reference
      order.payment = payment._id;
      await order.save();

      res.status(201).json({
        message: 'Payment created successfully',
        payment
      });
    } catch (error) {
      console.error('Error creating payment:', error);
      res.status(500).json({ message: 'Failed to create payment' });
    }
  },

  // Get payment by ID
  getPaymentById: async (req, res) => {
    try {
      const { paymentId } = req.params;
      const userId = req.user._id;

      const payment = await Payment.findById(paymentId)
        .populate('userId', 'name email')
        .populate('orderId', 'totalAmount status deliveryAddress');

      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }

      // Check if user owns the payment or is admin
      if (String(payment.userId._id) !== String(userId) && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized to view this payment' });
      }

      res.json({ payment });
    } catch (error) {
      console.error('Error fetching payment:', error);
      res.status(500).json({ message: 'Failed to fetch payment' });
    }
  },

  // Get payments by user
  getUserPayments: async (req, res) => {
    try {
      const userId = req.user._id;
      const { page = 1, limit = 10, status } = req.query;

      const query = { userId };
      if (status) {
        query.paymentStatus = status;
      }

      const payments = await Payment.find(query)
        .populate('orderId', 'totalAmount status deliveryAddress createdAt')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Payment.countDocuments(query);

      res.json({
        payments,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });
    } catch (error) {
      console.error('Error fetching user payments:', error);
      res.status(500).json({ message: 'Failed to fetch payments' });
    }
  },

  // Get all payments (admin only)
  getAllPayments: async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { page = 1, limit = 10, status, paymentMethod } = req.query;

      const query = {};
      if (status) query.paymentStatus = status;
      if (paymentMethod) query.paymentMethod = paymentMethod;

      const payments = await Payment.find(query)
        .populate('userId', 'name email')
        .populate('orderId', 'totalAmount status deliveryAddress createdAt')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Payment.countDocuments(query);

      res.json({
        payments,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });
    } catch (error) {
      console.error('Error fetching all payments:', error);
      res.status(500).json({ message: 'Failed to fetch payments' });
    }
  },

  // Update payment status
  updatePaymentStatus: async (req, res) => {
    try {
      const { paymentId } = req.params;
      const { paymentStatus, stripeChargeId, refundId, refundReason } = req.body;
      const userId = req.user._id;

      const payment = await Payment.findById(paymentId);
      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }

      // Check authorization
      if (String(payment.userId) !== String(userId) && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized to update this payment' });
      }

      // Update payment fields
      if (paymentStatus) payment.paymentStatus = paymentStatus;
      if (stripeChargeId) payment.stripeChargeId = stripeChargeId;
      if (refundId) payment.refundId = refundId;
      if (refundReason) payment.refundReason = refundReason;

      // Set timestamps
      if (paymentStatus === 'paid' && !payment.paidAt) {
        payment.paidAt = new Date();
      }
      if (paymentStatus === 'refunded' && !payment.refundedAt) {
        payment.refundedAt = new Date();
      }

      await payment.save();

      // Update order status if payment is confirmed
      if (paymentStatus === 'paid') {
        const order = await Order.findById(payment.orderId);
        if (order && order.status === 'pending') {
          order.status = 'confirmed';
          await order.save();
        }
      }

      res.json({
        message: 'Payment status updated successfully',
        payment
      });
    } catch (error) {
      console.error('Error updating payment status:', error);
      res.status(500).json({ message: 'Failed to update payment status' });
    }
  },

  // Get payment statistics
  getPaymentStats: async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const stats = await Payment.aggregate([
        {
          $group: {
            _id: '$paymentStatus',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]);

      const totalPayments = await Payment.countDocuments();
      const totalRevenue = await Payment.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      res.json({
        stats,
        totalPayments,
        totalRevenue: totalRevenue[0]?.total || 0
      });
    } catch (error) {
      console.error('Error fetching payment stats:', error);
      res.status(500).json({ message: 'Failed to fetch payment statistics' });
    }
  },

  // Delete payment (admin only)
  deletePayment: async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { paymentId } = req.params;

      const payment = await Payment.findById(paymentId);
      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }

      // Remove payment reference from order
      await Order.updateOne(
        { payment: paymentId },
        { $unset: { payment: 1 } }
      );

      await Payment.findByIdAndDelete(paymentId);

      res.json({ message: 'Payment deleted successfully' });
    } catch (error) {
      console.error('Error deleting payment:', error);
      res.status(500).json({ message: 'Failed to delete payment' });
    }
  }
};

module.exports = paymentController;
