const stripe = require('../config/stripe');
const Orders = require('../models/orderModel');
const Users = require('../models/userModel');

const paymentController = {
  // Create payment intent for an order
  createPaymentIntent: async (req, res) => {
    try {
      const { orderId } = req.params;
      const userId = req.user._id;

      console.log('🚀 Creating payment intent for order:', orderId);
      console.log('👤 User ID:', userId);
      console.log('🔑 Stripe secret key configured:', !!process.env.STRIPE_SECRET_KEY);
      console.log('🔑 Stripe key starts with sk_test:', process.env.STRIPE_SECRET_KEY?.startsWith('sk_test'));

      // Check if Stripe is configured
      if (!process.env.STRIPE_SECRET_KEY) {
        console.error('❌ Stripe secret key not configured');
        return res.status(400).json({ 
          message: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to environment variables.' 
        });
      }

      // Find the order
      console.log('🔍 Looking for order:', orderId);
      const order = await Orders.findById(orderId)
        .populate('user', 'name email')
        .populate('items.food', 'name price');

      if (!order) {
        console.error('❌ Order not found:', orderId);
        return res.status(404).json({ message: 'Order not found' });
      }

      console.log('📦 Order found:', {
        id: order._id,
        totalAmount: order.totalAmount,
        paymentStatus: order.payment.status,
        userId: order.user._id
      });

      // Check if user owns the order
      if (String(order.user._id) !== String(userId)) {
        console.error('❌ Unauthorized: User', userId, 'trying to pay for order owned by', order.user._id);
        return res.status(403).json({ message: 'Unauthorized to pay for this order' });
      }

      // Check if order is already paid
      if (order.payment.status === 'paid') {
        console.error('❌ Order already paid:', orderId);
        return res.status(400).json({ message: 'Order is already paid' });
      }

      // Create payment intent
      const amountInCents = Math.round(order.totalAmount * 100);
      console.log('💰 Creating payment intent with amount:', amountInCents, 'cents ($' + order.totalAmount + ')');
      
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

      console.log('✅ Payment intent created:', {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency
      });

      // Update order with payment intent ID
      order.payment.stripePaymentIntentId = paymentIntent.id;
      await order.save();
      console.log('💾 Order updated with payment intent ID');

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

      console.log('✅ Confirming payment:', paymentIntentId);
      console.log('👤 User ID:', userId);

      // Retrieve payment intent from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      console.log('💳 Payment intent status:', paymentIntent.status);

      if (paymentIntent.status !== 'succeeded') {
        console.error('❌ Payment not successful, status:', paymentIntent.status);
        return res.status(400).json({ message: 'Payment not successful' });
      }

      // Find the order
      console.log('🔍 Looking for order with payment intent:', paymentIntentId);
      const order = await Orders.findOne({
        'payment.stripePaymentIntentId': paymentIntentId,
        user: userId,
      });

      if (!order) {
        console.error('❌ Order not found for payment intent:', paymentIntentId);
        return res.status(404).json({ message: 'Order not found' });
      }

      console.log('📦 Order found for confirmation:', {
        id: order._id,
        currentStatus: order.status,
        currentPaymentStatus: order.payment.status
      });

      // Update order payment status
      order.payment.status = 'paid';
      order.payment.stripeChargeId = paymentIntent.latest_charge;
      order.payment.paymentMethod = paymentIntent.payment_method;
      order.payment.paidAt = new Date();
      order.status = 'confirmed'; // Move order to confirmed status

      await order.save();
      console.log('✅ Order payment confirmed and updated');

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
      }).select('payment status totalAmount');

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

      // Check if order is paid
      if (order.payment.status !== 'paid') {
        return res.status(400).json({ message: 'Order is not paid' });
      }

      // Create refund in Stripe
      const refund = await stripe.refunds.create({
        payment_intent: order.payment.stripePaymentIntentId,
        reason: reason || 'requested_by_customer',
      });

      // Update order payment status
      order.payment.status = 'refunded';
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
        console.log('PaymentIntent succeeded:', paymentIntent.id);
        
        // Update order status if needed
        try {
          const order = await Orders.findOne({
            'payment.stripePaymentIntentId': paymentIntent.id,
          });
          
          if (order && order.payment.status === 'pending') {
            order.payment.status = 'paid';
            order.payment.paidAt = new Date();
            order.status = 'confirmed';
            await order.save();
          }
        } catch (error) {
          console.error('Error updating order from webhook:', error);
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log('PaymentIntent failed:', failedPayment.id);
        
        // Update order status
        try {
          const order = await Orders.findOne({
            'payment.stripePaymentIntentId': failedPayment.id,
          });
          
          if (order) {
            order.payment.status = 'failed';
            await order.save();
          }
        } catch (error) {
          console.error('Error updating order from webhook:', error);
        }
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  },
};

module.exports = paymentController;
