const Users = require("../models/userModel");

const userController = {
  getAllUser: async (req, res) => {
    try {
      const users = await Users.find();
      res.status(200).json({ 
        message: "Users retrieved successfully",
        data: users,
        users: users // Keep both for backward compatibility
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  deleteUser: async (req, res) => {
    try {
      const user = await Users.findById(req.params.id);
      if (!user) {
        return res.status(400).json({ message: "user does not exist" });
      }
      await user.deleteOne();
      res.status(200).json({ message: "This user has been deleted" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  // Update user profile (name, email, phone, address)
  updateProfile: async (req, res) => {
    try {
      const userId = req.user._id;
      const { name, email, phone, address } = req.body;
      const user = await Users.findById(userId);
      if (!user) return res.status(404).json({ message: 'User not found' });
      if (name) user.name = name;
      if (email) user.email = email;
      if (phone) user.phone = phone;
      if (address) user.address = address;
      await user.save();
      res.json({ message: 'Profile updated successfully', user });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Delete user's own account
  deleteAccount: async (req, res) => {
    try {
      const userId = req.user._id;
      const user = await Users.findById(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Delete the user account
      await Users.findByIdAndDelete(userId);
      
      res.status(200).json({ 
        message: 'Account deleted successfully',
        success: true 
      });
    } catch (error) {
      res.status(500).json({ 
        message: error.message || 'Failed to delete account',
        success: false 
      });
    }
  },
};

module.exports = userController;
