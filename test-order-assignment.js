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

async function testOrderAssignment() {
  try {
    // Use default database URL if not in .env
    const dbUrl = process.env.DB || 'mongodb://localhost:27017/food-delivery';
    
    // Connect to database
    await mongoose.connect(dbUrl);
    console.log('Connected to database:', dbUrl);

    // Get a delivery man
    const deliveryMan = await Users.findOne({ role: 'delivery', status: 'active' });
    if (!deliveryMan) {
      console.log('No active delivery men found. Please create one first.');
      process.exit(1);
    }
    console.log('Using delivery man:', deliveryMan.name, deliveryMan.email);

    // Get an order that's not assigned
    let order = await Orders.findOne({ 
      deliveryMan: { $exists: false },
      status: { $in: ['pending', 'confirmed', 'preparing'] }
    });

    if (!order) {
      console.log('No unassigned orders found. Creating a test order...');
      
      // Get a regular user
      const user = await Users.findOne({ role: 'user' });
      if (!user) {
        console.log('No regular users found. Please create one first.');
        process.exit(1);
      }

      // Get a food item
      const Foods = require('./backend/models/foodModel');
      const food = await Foods.findOne({ available: true });
      if (!food) {
        console.log('No available food items found. Please add some food first.');
        process.exit(1);
      }

      // Create a test order
      order = new Orders({
        user: user._id,
        items: [{
          food: food._id,
          quantity: 2,
          price: food.price
        }],
        totalAmount: food.price * 2,
        status: 'ready',
        deliveryAddress: '123 Test Street, Test City',
        deliveryMan: deliveryMan._id
      });
      await order.save();
      console.log('Created test order:', order._id);
    } else {
      // Assign the order to the delivery man and set status to ready
      order.deliveryMan = deliveryMan._id;
      order.status = 'ready';
      await order.save();
      console.log('Assigned order to delivery man:', order._id);
    }

    // Verify the assignment
    const assignedOrder = await Orders.findById(order._id)
      .populate('user', 'name email')
      .populate('deliveryMan', 'name email')
      .populate('items.food', 'name price');

    console.log('\n=== Order Assignment Result ===');
    console.log('Order ID:', assignedOrder._id);
    console.log('Status:', assignedOrder.status);
    console.log('Customer:', assignedOrder.user.name);
    console.log('Delivery Man:', assignedOrder.deliveryMan.name);
    console.log('Total Amount:', assignedOrder.totalAmount);
    console.log('Delivery Address:', assignedOrder.deliveryAddress);

    console.log('\n=== Test Instructions ===');
    console.log('1. Login as delivery man:', deliveryMan.email);
    console.log('2. Go to Delivery Dashboard');
    console.log('3. You should see the order with "Start Delivery" button');
    console.log('4. Click "Start Delivery" to change status to out_for_delivery');
    console.log('5. Then click "Mark Delivered" to complete the delivery');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testOrderAssignment(); 