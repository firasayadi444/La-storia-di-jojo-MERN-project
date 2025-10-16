const express = require("express");
const { authMiddleware, adminAuthMiddleware } = require("../middlewares/authMiddleware");
const userController = require("../controllers/userController");
const router = express.Router();

router.get("/users", adminAuthMiddleware, userController.getAllUser);
router.delete("/users/:id", adminAuthMiddleware, userController.deleteUser);

// User profile management
router.put("/user/profile", authMiddleware, userController.updateProfile);
router.delete("/user/delete-account", authMiddleware, userController.deleteAccount);

module.exports = router;
