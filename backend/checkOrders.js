const mongoose = require("mongoose");
const Orders = require("./models/orderModel");
require("dotenv").config();

const checkOrders = async () => {
  try {
    await mongoose.connect(process.env.DB);
    console.log("Connected to database");

    const orders = await Orders.find().populate('user', 'name email');
    
    console.log(`Found ${orders.length} orders:`);
    orders.forEach((order, index) => {
      console.log(`${index + 1}. Order ID: ${order._id}`);
      console.log(`   User: ${order.user.name} (${order.user.email})`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Total: €${order.totalAmount}`);
      console.log(`   Created: ${order.createdAt}`);
      console.log(`   Delivery Man: ${order.deliveryMan || 'None'}`);
      console.log('---');
    });

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

checkOrders(); 