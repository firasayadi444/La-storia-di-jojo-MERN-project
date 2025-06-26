const express = require("express");
const orderController = require("../controllers/orderController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const router = express.Router();

// Test route to check if server is working
router.get("/test", (req, res) => {
  res.status(200).json({ message: "Order route is working" });
});

router.post("/order/new", authMiddleware, orderController.makeOrder);
router.get("/orders", authMiddleware, orderController.getAllOrders);
router.get("/orders/user", authMiddleware, orderController.getUserOrders);
router.get("/orders/delivery", authMiddleware, orderController.getDeliveryOrders);
router.get("/delivery-men", authMiddleware, orderController.getAvailableDeliveryMen);
router.put("/orders/:id/status", authMiddleware, orderController.updateOrderStatus);
router.delete("/orders/:id", authMiddleware, orderController.deleteOrder);
router.post("/orders/:id/feedback", authMiddleware, orderController.submitFeedback);
router.get('/orders/feedbacks', orderController.getAllFeedbacks);
router.get('/delivery-notifications', authMiddleware, orderController.getDeliveryNotifications);
router.get("/orders/delivery/history", authMiddleware, orderController.getDeliveryHistory);
router.get("/orders/delivery/earnings", authMiddleware, orderController.getDeliveryEarnings);

module.exports = router;
