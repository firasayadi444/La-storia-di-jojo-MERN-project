const mongoose = require("mongoose");
const connectDatabase = require("./utils/database");

const healthCheck = async () => {
  try {
    console.log("🏥 Running database health check...");
    
    // Connect to database
    await connectDatabase();
    
    // Check connection
    if (mongoose.connection.readyState !== 1) {
      throw new Error("Database not connected");
    }
    
    // Test basic operations
    const Users = require('./models/userModel');
    const Foods = require('./models/foodModel');
    const Orders = require('./models/orderModel');
    
    // Count documents
    const userCount = await Users.countDocuments();
    const foodCount = await Foods.countDocuments();
    const orderCount = await Orders.countDocuments();
    
    console.log("✅ Database Health Check Results:");
    console.log(`   📊 Users: ${userCount}`);
    console.log(`   🍕 Foods: ${foodCount}`);
    console.log(`   📦 Orders: ${orderCount}`);
    console.log(`   🔗 Connection: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    console.log(`   🗄️ Database: ${mongoose.connection.name}`);
    
    return {
      status: 'healthy',
      users: userCount,
      foods: foodCount,
      orders: orderCount,
      connection: mongoose.connection.readyState === 1
    };
    
  } catch (error) {
    console.error("❌ Database health check failed:", error.message);
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
};

// Run if called directly
if (require.main === module) {
  healthCheck().then(result => {
    if (result.status === 'healthy') {
      console.log("🎉 Database is healthy!");
      process.exit(0);
    } else {
      console.log("💥 Database is unhealthy!");
      process.exit(1);
    }
  });
}

module.exports = healthCheck; 