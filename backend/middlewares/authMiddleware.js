const Users = require("../models/userModel");
const jwt = require("jsonwebtoken");

// Set default JWT_SECRET if not provided
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "default_jwt_secret_key_for_development";
  console.log("No JWT_SECRET environment variable found, using default secret");
}

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
    console.error('Auth middleware error:', error);
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
    console.error('Admin auth middleware error:', error);
    return res.status(401).json({ message: "Invalid Authentication." });
  }
};

module.exports = { authMiddleware, adminAuthMiddleware };
