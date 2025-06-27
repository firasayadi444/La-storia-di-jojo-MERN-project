const Foods = require("../models/foodModel");
const { addFoodErrorHandler } = require("../utils/errorHandler");

// Helper function to construct full image URL
const getImageUrl = (filename) => {
  if (!filename) return null;
  if (filename.startsWith('http')) return filename; // Already a full URL
  return `${process.env.BASE_URL || 'http://localhost:5000'}/uploads/${filename}`;
};

const foodController = {
  addFood: async (req, res) => {
    try {
      const { name, category, price, description, available } = req.body;
      const image = req.file ? req.file.filename : null;
      
      const errorMessage = addFoodErrorHandler(
        name,
        category,
        price,
        description,
        image
      );
      if (errorMessage) return res.status(400).json({ message: errorMessage });
      
      const food = await new Foods({
        name,
        category,
        price,
        description,
        image,
        available: available !== undefined ? available : true,
      }).save();
      
      // Convert image filename to full URL
      const foodWithImageUrl = {
        ...food.toObject(),
        image: getImageUrl(food.image)
      };
      
      res.status(201).json({ message: "Successfully added new food", food: foodWithImageUrl });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
  
  getAllFoods: async (req, res) => {
    try {
      const foods = await Foods.find({ available: true });
      
      // Convert image filenames to full URLs
      const foodsWithImageUrls = foods.map(food => ({
        ...food.toObject(),
        image: getImageUrl(food.image)
      }));
      
      res.status(200).json({ 
        message: "Foods retrieved successfully",
        data: foodsWithImageUrls,
        foods: foodsWithImageUrls // Keep both for backward compatibility
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
  
  getFoodDetails: async (req, res) => {
    try {
      const food = await Foods.findById(req.params.id);
      if (!food)
        return res.status(400).json({ message: "This item does not exist" });
      
      // Convert image filename to full URL
      const foodWithImageUrl = {
        ...food.toObject(),
        image: getImageUrl(food.image)
      };
      
      res.status(200).json({ 
        message: "Food details retrieved successfully",
        data: foodWithImageUrl,
        food: foodWithImageUrl // Keep both for backward compatibility
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
  
  updateFood: async (req, res) => {
    try {
      let food = await Foods.findById(req.params.id);
      if (!food)
        return res.status(400).json({ message: "This item does not exist" });
      
      food = await Foods.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      });
      res.status(200).json({ message: "Successfully updated", food });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
  
  deleteFood: async (req, res) => {
    try {
      let food = await Foods.findById(req.params.id);
      if (!food)
        return res.status(400).json({ message: "This item does not exist" });
      
      await food.deleteOne();
      res.status(200).json({ message: "Item is successfully deleted" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
};

module.exports = foodController;
