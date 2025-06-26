const Foods = require("../models/foodModel");
const { addFoodErrorHandler } = require("../utils/errorHandler");

const foodController = {
  addFood: async (req, res) => {
    try {
      const { name, category, price, description, image, available } = req.body;
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
      
      res.status(201).json({ message: "Successfully added new food", food });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
  
  getAllFoods: async (req, res) => {
    try {
      const foods = await Foods.find({ available: true });
      res.status(200).json({ foods });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
  
  getFoodDetails: async (req, res) => {
    try {
      const food = await Foods.findById(req.params.id);
      if (!food)
        return res.status(400).json({ message: "This item does not exist" });
      res.status(200).json({ food });
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
