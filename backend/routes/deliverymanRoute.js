const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const deliverymanController = require('../controllers/deliverymanController');

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

// List all pending deliveryman applications - SPECIFIC ROUTE FIRST
router.get('/pending', deliverymanController.listPending);

// GET /api/deliveryman/all - SPECIFIC ROUTE FIRST
router.get('/all', deliverymanController.listAll);

// Approve a deliveryman application
router.post('/approve/:id', deliverymanController.approve);

// Reject a deliveryman application
router.post('/reject/:id', deliverymanController.reject);

// Delete a delivery man by ID (admin only)
router.delete('/:id', deliverymanController.deleteById);

// Get a single delivery man by ID - GENERIC ROUTE LAST
router.get('/:id', deliverymanController.getById);

module.exports = router; 