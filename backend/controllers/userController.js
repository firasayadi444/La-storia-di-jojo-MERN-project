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
};

module.exports = userController;
