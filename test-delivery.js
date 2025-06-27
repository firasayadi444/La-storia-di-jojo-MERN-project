const mongoose = require('mongoose');
const path = require('path');
const Users = require('./backend/models/userModel');
const Orders = require('./backend/models/orderModel');

// Try to load .env file
try {
  require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });
} catch (error) {
  console.log('No .env file found, using default database URL');
}

async function testDeliveryWorkflow() {
  try {
    // Use default database URL if not in .env
    const dbUrl = process.env.DB || 'mongodb://localhost:27017/food-delivery';
    
    // Connect to database
    await mongoose.connect(dbUrl);
    console.log('Connected to database:', dbUrl);

    // Check delivery men
    const deliveryMen = await Users.find({ role: 'delivery' });
    console.log('\n=== Delivery Men ===');
    console.log(`Total delivery men: ${deliveryMen.length}`);
    deliveryMen.forEach(dm => {
      console.log(`- ${dm.name} (${dm.email}): ${dm.status}, Available: ${dm.isAvailable}`);
    });

    // Check orders
    const orders = await Orders.find().populate('user', 'name email').populate('deliveryMan', 'name email');
    console.log('\n=== Orders ===');
    console.log(`Total orders: ${orders.length}`);
    orders.forEach(order => {
      console.log(`- Order ${order._id.slice(-6)}: ${order.status}, Customer: ${order.user?.name}, Delivery Man: ${order.deliveryMan?.name || 'None'}`);
    });

    // Check orders assigned to delivery men
    const assignedOrders = await Orders.find({ 
      deliveryMan: { $exists: true, $ne: null },
      status: { $in: ['ready', 'out_for_delivery'] }
    }).populate('user', 'name email').populate('deliveryMan', 'name email');
    
    console.log('\n=== Assigned Active Orders ===');
    console.log(`Active assigned orders: ${assignedOrders.length}`);
    assignedOrders.forEach(order => {
      console.log(`- Order ${order._id.slice(-6)}: ${order.status}, Customer: ${order.user?.name}, Delivery Man: ${order.deliveryMan?.name}`);
    });

    // Check available delivery men
    const availableDeliveryMen = await Users.find({ 
      role: 'delivery', 
      isAvailable: true,
      status: 'active'
    });
    console.log('\n=== Available Delivery Men ===');
    console.log(`Available delivery men: ${availableDeliveryMen.length}`);
    availableDeliveryMen.forEach(dm => {
      console.log(`- ${dm.name} (${dm.email})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testDeliveryWorkflow(); 