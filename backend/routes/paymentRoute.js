const express = require('express');
const paymentController = require('../controllers/paymentController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const router = express.Router();

// Create payment intent for an order
router.post('/create-payment-intent/:orderId', authMiddleware, paymentController.createPaymentIntent);

// Confirm payment
router.post('/confirm-payment', authMiddleware, paymentController.confirmPayment);


// Get payment status
router.get('/status/:orderId', authMiddleware, paymentController.getPaymentStatus);

// Refund payment (admin only)
router.post('/refund/:orderId', authMiddleware, paymentController.refundPayment);

// Stripe webhook (no auth required)
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);

module.exports = router;
