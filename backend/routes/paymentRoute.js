const express = require('express');
const paymentController = require('../controllers/paymentController');
const paymentModelController = require('../controllers/paymentModelController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const router = express.Router();

// Legacy Stripe payment routes
// Create payment intent for an order
router.post('/create-payment-intent/:orderId', authMiddleware, paymentController.createPaymentIntent);

// Confirm payment
router.post('/confirm-payment', authMiddleware, paymentController.confirmPayment);

// Get payment status
router.get('/status/:orderId', authMiddleware, paymentController.getPaymentStatus);

// Refund payment
router.post('/refund/:orderId', authMiddleware, paymentController.refundPayment);

// Webhook handler
router.post('/webhook', paymentController.handleWebhook);

// New Payment Model routes
// Create payment
router.post('/', authMiddleware, paymentModelController.createPayment);

// Get payment by ID
router.get('/:paymentId', authMiddleware, paymentModelController.getPaymentById);

// Get user payments
router.get('/user/payments', authMiddleware, paymentModelController.getUserPayments);

// Get all payments (admin only)
router.get('/admin/all', authMiddleware, paymentModelController.getAllPayments);

// Update payment status
router.put('/:paymentId/status', authMiddleware, paymentModelController.updatePaymentStatus);

// Get payment statistics (admin only)
router.get('/admin/stats', authMiddleware, paymentModelController.getPaymentStats);

// Delete payment (admin only)
router.delete('/:paymentId', authMiddleware, paymentModelController.deletePayment);

module.exports = router;
