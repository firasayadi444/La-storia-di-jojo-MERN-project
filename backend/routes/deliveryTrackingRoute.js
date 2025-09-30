const express = require('express');
const router = express.Router();
const deliveryTrackingController = require('../controllers/deliveryTrackingController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Start delivery tracking
router.post('/:orderId/start', deliveryTrackingController.startDelivery);

// Update delivery person location
router.post('/:orderId/location', deliveryTrackingController.updateDeliveryLocation);

// Get delivery tracking information
router.get('/:orderId/tracking', deliveryTrackingController.getDeliveryTracking);

// Complete delivery
router.post('/:orderId/complete', deliveryTrackingController.completeDelivery);

// Get active deliveries for delivery person
router.get('/active', deliveryTrackingController.getActiveDeliveries);

module.exports = router;
