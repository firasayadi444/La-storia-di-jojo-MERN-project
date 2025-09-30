const express = require('express');
const router = express.Router();
const deliveryHistoryController = require('../controllers/deliveryHistoryController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Create delivery history (delivery person only)
router.post('/create', 
  (req, res, next) => {
    if (req.user.role !== 'delivery') {
      return res.status(403).json({ message: 'Access denied. Delivery person role required.' });
    }
    next();
  },
  deliveryHistoryController.createDeliveryHistory
);

// Update delivery status (delivery person only)
router.put('/:deliveryHistoryId/status',
  (req, res, next) => {
    if (req.user.role !== 'delivery') {
      return res.status(403).json({ message: 'Access denied. Delivery person role required.' });
    }
    next();
  },
  deliveryHistoryController.updateDeliveryStatus
);

// Add route point (delivery person only)
router.post('/:deliveryHistoryId/route-point',
  (req, res, next) => {
    if (req.user.role !== 'delivery') {
      return res.status(403).json({ message: 'Access denied. Delivery person role required.' });
    }
    next();
  },
  deliveryHistoryController.addRoutePoint
);

// Get delivery history (delivery person only)
router.get('/',
  (req, res, next) => {
    if (req.user.role !== 'delivery') {
      return res.status(403).json({ message: 'Access denied. Delivery person role required.' });
    }
    next();
  },
  deliveryHistoryController.getDeliveryHistory
);

// Get delivery statistics (delivery person only)
router.get('/stats',
  (req, res, next) => {
    if (req.user.role !== 'delivery') {
      return res.status(403).json({ message: 'Access denied. Delivery person role required.' });
    }
    next();
  },
  deliveryHistoryController.getDeliveryStats
);

// Get specific delivery history details (delivery person only)
router.get('/:deliveryHistoryId',
  (req, res, next) => {
    if (req.user.role !== 'delivery') {
      return res.status(403).json({ message: 'Access denied. Delivery person role required.' });
    }
    next();
  },
  deliveryHistoryController.getDeliveryHistoryDetails
);

module.exports = router;
