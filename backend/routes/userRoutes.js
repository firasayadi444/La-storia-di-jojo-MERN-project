const express = require("express");
const { authMiddleware, adminAuthMiddleware } = require("../middlewares/authMiddleware");
const userController = require("../controllers/userController");
const router = express.Router();

router.get("/users", userController.getAllUser);
router.delete("/user/:id", userController.deleteUser);

// User profile management
router.put("/user/profile", authMiddleware, userController.updateProfile);

module.exports = router;
