const Users = require("../models/userModel");
const jwt = require("jsonwebtoken");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Please login to continue" });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await Users.findOne({ _id: decoded._id });
    if (!user) {
      return res.status(401).json({ message: "Invalid Authentication." });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid Authentication." });
  }
};

const adminAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Please login to continue" });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await Users.findOne({ _id: decoded._id });
    if (!user) {
      return res.status(401).json({ message: "Invalid Authentication." });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ message: "You are not authorized" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid Authentication." });
  }
};

module.exports = { authMiddleware, adminAuthMiddleware };
