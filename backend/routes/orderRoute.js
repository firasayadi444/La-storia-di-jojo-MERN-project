const express = require("express");
const orderController = require("../controllers/orderController");
const { authMiddleware, adminAuthMiddleware } = require("../middlewares/authMiddleware");
const router = express.Router();

// Test route to check if server is working
router.get("/test", (req, res) => {
  res.status(200).json({ message: "Order route is working" });
});

// Order management routes
router.post("/order/new", authMiddleware, orderController.makeOrder);
router.get("/orders", adminAuthMiddleware, orderController.getAllOrders);
router.get("/orders/user", authMiddleware, orderController.getUserOrders);
router.get("/orders/delivery", authMiddleware, orderController.getDeliveryOrders);
router.get("/orders/:id/customer-location", authMiddleware, orderController.getOrderCustomerLocation);
router.get("/orders/:orderId/eta", authMiddleware, orderController.getRealTimeETA);
router.get("/delivery-men", authMiddleware, orderController.getAvailableDeliveryMen);
router.put("/orders/:id/cancel", authMiddleware, orderController.cancelOrder);
router.put("/orders/:id/status", authMiddleware, orderController.updateOrderStatus);
router.delete("/orders/:id", adminAuthMiddleware, orderController.deleteOrder);
router.post("/orders/:id/feedback", authMiddleware, orderController.submitFeedback);
router.get('/orders/feedbacks', orderController.getAllFeedbacks);
router.get('/delivery-notifications', authMiddleware, orderController.getDeliveryNotifications);

// Delivery man specific routes
router.get('/orders/delivery/history', authMiddleware, orderController.getDeliveryHistory);
// router.put('/:id/complete-delivery', authMiddleware, orderController.completeDelivery);
// router.put('/:id/rate-delivery', authMiddleware, orderController.rateDelivery);
// router.put('/:id/rate-food', authMiddleware, orderController.rateFood);
// router.put('/:id/feedback', authMiddleware, orderController.addFeedback);

router.get('/admin/ordershistory', adminAuthMiddleware, orderController.getDeliveredOrders);

router.get('/user-notifications', authMiddleware, orderController.getUserNotifications);

// Order tracking route
router.get('/orders/:orderId/tracking', authMiddleware, orderController.getOrderTracking);

module.exports = router;
