const express = require('express');
const locationController = require('../controllers/locationController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const router = express.Router();

// DEPRECATED: Update user location - Use delivery tracking endpoints instead
router.post('/update', authMiddleware, locationController.updateLocation);

// DEPRECATED: Get delivery person's trajectory - Use delivery tracking endpoints instead
router.get('/trajectory/:deliveryManId', authMiddleware, locationController.getDeliveryTrajectory);

module.exports = router;
