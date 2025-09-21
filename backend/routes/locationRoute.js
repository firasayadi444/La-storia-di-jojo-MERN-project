const express = require('express');
const locationController = require('../controllers/locationController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const router = express.Router();

// Update user location
router.post('/update', authMiddleware, locationController.updateLocation);

// Get user's location history
router.get('/history', authMiddleware, locationController.getUserLocations);

// Get current location of a user
router.get('/current/:userId', authMiddleware, locationController.getCurrentLocation);

// Get nearby delivery personnel
router.get('/nearby-delivery', authMiddleware, locationController.getNearbyDeliveryMen);

// Get delivery person's trajectory
router.get('/trajectory/:deliveryManId', authMiddleware, locationController.getDeliveryTrajectory);

// Get all locations (admin only)
router.get('/admin/all', authMiddleware, locationController.getAllLocations);

// Deactivate old locations (admin only)
router.post('/admin/cleanup', authMiddleware, locationController.deactivateOldLocations);

// Get location statistics (admin only)
router.get('/admin/stats', authMiddleware, locationController.getLocationStats);

// Delete location
router.delete('/:locationId', authMiddleware, locationController.deleteLocation);

module.exports = router;
