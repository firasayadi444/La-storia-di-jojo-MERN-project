const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const deliverymanController = require('../controllers/deliverymanController');

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

// List all pending deliveryman applications
router.get('/pending', deliverymanController.listPending);
// Approve a deliveryman application
router.post('/approve/:id', deliverymanController.approve);
// Reject a deliveryman application
router.post('/reject/:id', deliverymanController.reject);

// GET /api/deliverymen/all
router.get('/all', deliverymanController.listAll);
// GET /api/deliverymen/:id
router.get('/:id', deliverymanController.getById);

module.exports = router; 