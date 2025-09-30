const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const deliverymanController = require('../controllers/deliverymanController');
const { authMiddleware, adminAuthMiddleware } = require('../middlewares/authMiddleware');

// Test route to check if deliverymanRoute is loaded
router.get('/test', (req, res) => {
  res.json({ message: 'Deliveryman route is working' });
});

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/deliveryman'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// POST /api/deliveryman/apply
router.post('/apply', upload.fields([
  { name: 'vehiclePhoto', maxCount: 1 },
  { name: 'facePhoto', maxCount: 1 },
  { name: 'cinPhoto', maxCount: 1 },
]), deliverymanController.apply);

// List all pending deliveryman applications - Admin only
router.get('/pending', adminAuthMiddleware, deliverymanController.listPending);

// GET /api/deliveryman/all - Admin only
router.get('/all', adminAuthMiddleware, deliverymanController.listAll);

// Approve a deliveryman application - Admin only
router.post('/approve/:id', adminAuthMiddleware, deliverymanController.approve);

// Reject a deliveryman application - Admin only
router.post('/reject/:id', adminAuthMiddleware, deliverymanController.reject);

// Update delivery man availability (delivery man only)
console.log('updateAvailability:', typeof deliverymanController.updateAvailability);
router.put('/availability', authMiddleware, deliverymanController.updateAvailability);

// Delete a delivery man by ID (admin only)
router.delete('/:id', adminAuthMiddleware, deliverymanController.deleteById);

// Get a single delivery man by ID - Admin only
router.get('/:id', adminAuthMiddleware, deliverymanController.getById);

// Delivery tracking routes (delivery man only)
router.post('/location', authMiddleware, deliverymanController.updateLocation);
router.get('/tracking/:orderId', authMiddleware, deliverymanController.getOrderTracking);
router.put('/status', authMiddleware, deliverymanController.updateDeliveryStatus);

module.exports = router; 