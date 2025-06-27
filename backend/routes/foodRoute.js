const express = require("express");
const multer = require('multer');
const foodController = require("../controllers/foodController");
const { adminAuthMiddleware } = require("../middlewares/authMiddleware");
const router = express.Router();

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'food-' + uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage });

router.post("/food/new", adminAuthMiddleware, upload.single('image'), foodController.addFood);
router.get("/foods", foodController.getAllFoods);
router.get("/food/:id", foodController.getFoodDetails);
router.put("/food/:id", adminAuthMiddleware, foodController.updateFood);
router.delete("/food/:id", adminAuthMiddleware, foodController.deleteFood);

module.exports = router;
