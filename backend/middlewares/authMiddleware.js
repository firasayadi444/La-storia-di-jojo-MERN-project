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
    console.log('Token received:', token.substring(0, 20) + '...');
    
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded token:', decoded);
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    
    // Check if decoded has the expected structure
    if (!decoded || !decoded._id) {
      console.error('Invalid token structure:', decoded);
      return res.status(401).json({ message: "Invalid token structure" });
    }
    
    const user = await Users.findOne({ _id: decoded._id });
    if (!user) {
      console.error('User not found for ID:', decoded._id);
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    console.error('Error stack:', error.stack);
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
    console.log('Admin token received:', token.substring(0, 20) + '...');
    
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Admin decoded token:', decoded);
    } catch (jwtError) {
      console.error('Admin JWT verification error:', jwtError);
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    
    // Check if decoded has the expected structure
    if (!decoded || !decoded._id) {
      console.error('Invalid admin token structure:', decoded);
      return res.status(401).json({ message: "Invalid token structure" });
    }
    
    const user = await Users.findOne({ _id: decoded._id });
    if (!user) {
      console.error('Admin user not found for ID:', decoded._id);
      return res.status(401).json({ message: "User not found" });
    }

    if (user.role !== "admin") {
      console.error('User is not admin:', user.role);
      return res.status(403).json({ message: "You are not authorized" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    console.error('Admin error stack:', error.stack);
    return res.status(401).json({ message: "Invalid Authentication." });
  }
};

module.exports = { authMiddleware, adminAuthMiddleware };
