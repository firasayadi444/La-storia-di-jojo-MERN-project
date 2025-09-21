const stripe = require('../config/stripe');
const Orders = require('../models/orderModel');
const Users = require('../models/userModel');
const Payment = require('../models/paymentModel');
const socketService = require('../services/socketService');

const paymentController = {
  // Create payment intent for an order
  createPaymentIntent: async (req, res) => {
    try {
      const { orderId } = req.params;
      const userId = req.user._id;


      // Check if Stripe is configured
      if (!process.env.STRIPE_SECRET_KEY) {
        console.error('❌ Stripe secret key not configured');
        return res.status(400).json({ 
          message: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to environment variables.' 
        });
      }

      // Find the order
      const order = await Orders.findById(orderId)
        .populate('user', 'name email')
        .populate('items.food', 'name price');

      if (!order) {
        console.error('❌ Order not found:', orderId);
        return res.status(404).json({ message: 'Order not found' });
      }


      // Check if user owns the order
      if (String(order.user._id) !== String(userId)) {
        console.error('❌ Unauthorized: User', userId, 'trying to pay for order owned by', order.user._id);
        return res.status(403).json({ message: 'Unauthorized to pay for this order' });
      }

      // Check if payment exists and get its status
      let paymentStatus = 'pending';
      if (order.payment) {
        const payment = await Payment.findById(order.payment);
        if (payment) {
          paymentStatus = payment.paymentStatus;
        }
      }

      // Check if order is already paid
      if (paymentStatus === 'paid') {
        console.error('❌ Order already paid:', orderId);
        return res.status(400).json({ message: 'Order is already paid' });
      }

      // Create payment intent
      const amountInCents = Math.round(order.totalAmount * 100);
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents, // Convert to cents
        currency: 'usd',
        metadata: {
          orderId: order._id.toString(),
          userId: userId.toString(),
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });


      // Create or update payment entity
      let payment;
      if (order.payment) {
        // Update existing payment
        payment = await Payment.findById(order.payment);
        if (payment) {
          payment.stripePaymentIntentId = paymentIntent.id;
          payment.paymentMethod = 'card';
          await payment.save();
        }
      } else {
        // Create new payment
        payment = new Payment({
          userId: userId,
          orderId: orderId,
          amount: order.totalAmount,
          paymentMethod: 'card',
          stripePaymentIntentId: paymentIntent.id,
          paymentStatus: 'pending'
        });
        await payment.save();
        
        // Update order with payment reference
        order.payment = payment._id;
        await order.save();
      }
      

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error) {
      console.error('❌ Payment intent creation error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        type: error.type,
        code: error.code,
        stack: error.stack
      });
      res.status(500).json({ message: 'Failed to create payment intent' });
    }
  },

  // Confirm payment and update order
  confirmPayment: async (req, res) => {
    try {
      const { paymentIntentId } = req.body;
      const userId = req.user._id;


      // Retrieve payment intent from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== 'succeeded') {
        console.error('❌ Payment not successful, status:', paymentIntent.status);
        return res.status(400).json({ message: 'Payment not successful' });
      }

      // Find the order through the payment entity
      
      // First find the payment entity with this payment intent ID
      const payment = await Payment.findOne({
        stripePaymentIntentId: paymentIntentId,
        userId: userId
      });
      
      if (!payment) {
        console.error('❌ Payment not found for payment intent:', paymentIntentId);
        return res.status(404).json({ message: 'Payment not found' });
      }
      
      // Then find the order using the payment's orderId
      const order = await Orders.findOne({
        _id: payment.orderId,
        user: userId,
      });

      if (!order) {
        console.error('❌ Order not found for payment intent:', paymentIntentId);
        return res.status(404).json({ message: 'Order not found' });
      }


      // Update payment entity (we already have it from the query above)
      payment.paymentStatus = 'paid';
      payment.stripeChargeId = paymentIntent.latest_charge;
      payment.paidAt = new Date();
      await payment.save();

      // Update order status
      order.status = 'confirmed'; // Move order to confirmed status
      await order.save();

      // Populate order with payment data for WebSocket event
      const populatedOrder = await Orders.findById(order._id)
        .populate('user', 'name email')
        .populate('items.food', 'name price image category')
        .populate('deliveryMan', 'name phone')
        .populate('payment');
        

      // Emit WebSocket event for order update
      const io = socketService.getIO();
      if (io) {
        
        // Notify the customer
        io.to(`user-${userId}`).emit('order-updated', {
          type: 'order-updated',
          order: populatedOrder,
          message: `Your order #${order._id} payment confirmed and status updated to confirmed`
        });
        
        // Notify admin
        io.to('admin').emit('order-updated', {
          type: 'order-updated',
          order: populatedOrder,
          message: `Order #${order._id} payment confirmed and status updated to confirmed`
        });
        
        // Notify delivery
        io.to('delivery').emit('order-updated', {
          type: 'order-updated',
          order: populatedOrder,
          message: `Order #${order._id} payment confirmed and status updated to confirmed`
        });
      } else {
      }

      res.json({
        message: 'Payment confirmed successfully',
        order,
      });
    } catch (error) {
      console.error('❌ Payment confirmation error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        type: error.type,
        code: error.code,
        stack: error.stack
      });
      res.status(500).json({ message: 'Failed to confirm payment' });
    }
  },

  // Get payment status for an order
  getPaymentStatus: async (req, res) => {
    try {
      const { orderId } = req.params;
      const userId = req.user._id;

      const order = await Orders.findOne({
        _id: orderId,
        user: userId,
      }).select('payment status totalAmount').populate('payment');

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      res.json({
        payment: order.payment,
        status: order.status,
        totalAmount: order.totalAmount,
      });
    } catch (error) {
      console.error('Get payment status error:', error);
      res.status(500).json({ message: 'Failed to get payment status' });
    }
  },


  // Refund payment
  refundPayment: async (req, res) => {
    try {
      const { orderId } = req.params;
      const { reason } = req.body;

      // Find the order
      const order = await Orders.findById(orderId)
        .populate('user', 'name email');

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Get payment entity
      let payment = null;
      if (order.payment) {
        payment = await Payment.findById(order.payment);
      }

      if (!payment || payment.paymentStatus !== 'paid') {
        return res.status(400).json({ message: 'Order is not paid' });
      }

      // Create refund in Stripe
      const refund = await stripe.refunds.create({
        payment_intent: payment.stripePaymentIntentId,
        reason: reason || 'requested_by_customer',
      });

      // Update payment entity
      payment.paymentStatus = 'refunded';
      payment.refundedAt = new Date();
      payment.refundId = refund.id;
      payment.refundReason = reason || 'requested_by_customer';
      await payment.save();

      // Update order status
      order.status = 'cancelled';
      await order.save();

      res.json({
        message: 'Refund processed successfully',
        refundId: refund.id,
        order,
      });
    } catch (error) {
      console.error('Refund error:', error);
      res.status(500).json({ message: 'Failed to process refund' });
    }
  },

  // Webhook handler for Stripe events
  handleWebhook: async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        
        // Update order status if needed
        try {
          const order = await Orders.findOne({
            payment: { $exists: true }
          }).populate('payment');
          
          if (order && order.payment && order.payment.stripePaymentIntentId === paymentIntent.id) {
            if (order.payment.paymentStatus === 'pending') {
              order.payment.paymentStatus = 'paid';
              order.payment.paidAt = new Date();
              await order.payment.save();
              
              order.status = 'confirmed';
              await order.save();
            }
          }
        } catch (error) {
          console.error('Error updating order from webhook:', error);
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        
        // Update order status
        try {
          const order = await Orders.findOne({
            payment: { $exists: true }
          }).populate('payment');
          
          if (order && order.payment && order.payment.stripePaymentIntentId === failedPayment.id) {
            order.payment.paymentStatus = 'failed';
            await order.payment.save();
          }
        } catch (error) {
          console.error('Error updating order from webhook:', error);
        }
        break;

      default:
    }

    res.json({ received: true });
  },
};

module.exports = paymentController;
