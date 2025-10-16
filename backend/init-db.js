const mongoose = require("mongoose");
const connectDatabase = require("./utils/database");

const initDatabase = async () => {
  try {
    console.log("🔄 Initializing database...");
    
    // Connect to database (non-async initializer)
    connectDatabase();
    
    // Wait for connection to be ready
    await new Promise(resolve => {
      if (mongoose.connection.readyState === 1) {
        resolve();
      } else {
        mongoose.connection.once('connected', resolve);
      }
    });
    
    console.log("✅ Database connected successfully");
    
    // Create indexes for better performance
    const Users = require('./models/userModel');
    const Foods = require('./models/foodModel');
    const Orders = require('./models/orderModel');
    
    // Create indexes
    await Users.collection.createIndex({ email: 1 }, { unique: true });
    await Users.collection.createIndex({ role: 1 });
    await Users.collection.createIndex({ status: 1 });
    await Users.collection.createIndex({ "currentLocation": "2dsphere" });
    
    await Foods.collection.createIndex({ name: 1 });
    await Foods.collection.createIndex({ category: 1 });
    await Foods.collection.createIndex({ available: 1 });
    
    await Orders.collection.createIndex({ user: 1 });
    await Orders.collection.createIndex({ status: 1 });
    await Orders.collection.createIndex({ deliveryMan: 1 });
    await Orders.collection.createIndex({ createdAt: -1 });
    
    console.log("✅ Database indexes created");
    
    // Check if data already exists
    const userCount = await Users.countDocuments();
    const foodCount = await Foods.countDocuments();
    
    if (userCount === 0 && foodCount === 0) {
      console.log("🌱 No data found, running seed script...");
      require('./seedData');
    } else {
      console.log(`📊 Database already has data: ${userCount} users, ${foodCount} foods`);
    }
    
    console.log("🎉 Database initialization complete!");
    
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase; 