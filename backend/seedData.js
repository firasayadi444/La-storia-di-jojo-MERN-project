const mongoose = require("mongoose");
const Foods = require("./models/foodModel");
const Users = require("./models/userModel");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const sampleFoods = [

  {
    name: "Classic Burger",
    category: "Burgers",
    price: 9.99,
    description: "Juicy beef patty with lettuce, tomato, onion, and our special sauce",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop",
    available: true
  },

  {
    name: "Caesar Salad",
    category: "Salads",
    price: 8.99,
    description: "Fresh romaine lettuce, croutons, parmesan cheese, and caesar dressing",
    image: "https://images.unsplash.com/photo-1551248429-40975aa4de74?w=400&h=300&fit=crop",
    available: true
  },



  {
    name: "Chocolate Cake",
    category: "Desserts",
    price: 6.99,
    description: "Rich chocolate cake with chocolate ganache",
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop",
    available: true
  }
];

const seedDatabase = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.DB);
    console.log("Connected to database");

    // Clear existing data
    await Foods.deleteMany({});
    await Users.deleteMany({});
    console.log("Cleared existing food and user data");

    // Insert sample foods
    await Foods.insertMany(sampleFoods);
    console.log("Added sample food items");

    // Hash password
    const hashedPassword = await bcrypt.hash("password", 10);

    // Create users
    const adminUser = await Users.create({
      name: "Admin User",
      email: "admin@food.com",
      password: hashedPassword,
      role: "admin",
      address: "123 Admin Street, City",
      phone: "+1234567890"
    });

    const regularUser = await Users.create({
      name: "Regular User",
      email: "user@food.com",
      password: hashedPassword,
      role: "user",
      address: "456 User Avenue, City",
      phone: "+1234567891"
    });

    // Create delivery men
    const deliveryMan1 = await Users.create({
      name: "Marco Rossi",
      email: "marco@delivery.com",
      password: hashedPassword,
      role: "delivery",
      address: "789 Delivery Road, City",
      phone: "+1234567892",
      isAvailable: true,
      currentLocation: {
        type: "Point",
        coordinates: [12.4964, 41.9028] // Rome coordinates
      },
      status: "active"
    });

    const deliveryMan2 = await Users.create({
      name: "Giuseppe Bianchi",
      email: "giuseppe@delivery.com",
      password: hashedPassword,
      role: "delivery",
      address: "321 Delivery Lane, City",
      phone: "+1234567893",
      isAvailable: true,
      currentLocation: {
        type: "Point",
        coordinates: [12.4964, 41.9028] // Rome coordinates
      },
      status: "active"
    });

    const deliveryMan3 = await Users.create({
      name: "Antonio Verdi",
      email: "antonio@delivery.com",
      password: hashedPassword,
      role: "delivery",
      address: "654 Delivery Blvd, City",
      phone: "+1234567894",
      isAvailable: false, // Currently unavailable
      currentLocation: {
        type: "Point",
        coordinates: [12.4964, 41.9028] // Rome coordinates
      },
      status: "active"
    });

    // Add pending deliverymen
    const pendingDeliveryMan1 = await Users.create({
      name: "Luca Pending",
      email: "luca@pending.com",
      password: hashedPassword,
      role: "delivery",
      address: "111 Pending St, City",
      phone: "+1234567895",
      isAvailable: false,
      currentLocation: {
        type: "Point",
        coordinates: [12.4964, 41.9028]
      },
      status: "pending"
    });

    const pendingDeliveryMan2 = await Users.create({
      name: "Francesca Pending",
      email: "francesca@pending.com",
      password: hashedPassword,
      role: "delivery",
      address: "222 Pending Ave, City",
      phone: "+1234567896",
      isAvailable: false,
      currentLocation: {
        type: "Point",
        coordinates: [12.4964, 41.9028]
      },
      status: "pending"
    });

    // Add sample delivered orders in different months for analytics
    const foods = await Foods.find();
    const users = await Users.find({ role: 'user' });
    const deliveryMen = await Users.find({ role: 'delivery', status: 'active' });
    const Orders = require('./models/orderModel');
    await Orders.deleteMany({});

    const monthsAgo = (n) => {
      const d = new Date();
      d.setMonth(d.getMonth() - n);
      return d;
    };

    const sampleOrders = [
      {
        user: users[0]._id,
        items: [
          { food: foods[0]._id, quantity: 2, price: foods[0].price },
          { food: foods[1]._id, quantity: 1, price: foods[1].price }
        ],
        totalAmount: foods[0].price * 2 + foods[1].price,
        status: 'delivered',
        deliveryAddress: '456 User Avenue, City',
        deliveryMan: deliveryMen[0]._id,
        estimatedDeliveryTime: monthsAgo(3),
        actualDeliveryTime: monthsAgo(3),
        createdAt: monthsAgo(3),
        updatedAt: monthsAgo(3)
      },
      {
        user: users[0]._id,
        items: [
          { food: foods[2]._id, quantity: 3, price: foods[2].price }
        ],
        totalAmount: foods[2].price * 3,
        status: 'delivered',
        deliveryAddress: '456 User Avenue, City',
        deliveryMan: deliveryMen[1]._id,
        estimatedDeliveryTime: monthsAgo(2),
        actualDeliveryTime: monthsAgo(2),
        createdAt: monthsAgo(2),
        updatedAt: monthsAgo(2)
      },
      {
        user: users[0]._id,
        items: [
          { food: foods[1]._id, quantity: 1, price: foods[1].price }
        ],
        totalAmount: foods[1].price,
        status: 'delivered',
        deliveryAddress: '456 User Avenue, City',
        deliveryMan: deliveryMen[2]._id,
        estimatedDeliveryTime: monthsAgo(1),
        actualDeliveryTime: monthsAgo(1),
        createdAt: monthsAgo(1),
        updatedAt: monthsAgo(1)
      },
      {
        user: users[0]._id,
        items: [
          { food: foods[0]._id, quantity: 1, price: foods[0].price }
        ],
        totalAmount: foods[0].price,
        status: 'delivered',
        deliveryAddress: '789 New Street, City',
        deliveryMan: deliveryMen[0]._id,
        estimatedDeliveryTime: monthsAgo(5),
        actualDeliveryTime: monthsAgo(5),
        createdAt: monthsAgo(5),
        updatedAt: monthsAgo(5)
      },
      {
        user: users[0]._id,
        items: [
          { food: foods[2]._id, quantity: 2, price: foods[2].price }
        ],
        totalAmount: foods[2].price * 2,
        status: 'delivered',
        deliveryAddress: '123 Another Ave, City',
        deliveryMan: deliveryMen[1]._id,
        estimatedDeliveryTime: monthsAgo(4),
        actualDeliveryTime: monthsAgo(4),
        createdAt: monthsAgo(4),
        updatedAt: monthsAgo(4)
      }
    ];
    await Orders.insertMany(sampleOrders);
    console.log('Sample delivered orders added for analytics.');

    console.log("Database seeded successfully!");
    console.log(`👥 Users created: ${await Users.countDocuments()}`);
    console.log(`🍕 Food items created: ${await Foods.countDocuments()}`);
    console.log("\n📧 Test Accounts:");
    console.log("Admin: admin@food.com / password");
    console.log("User: user@food.com / password");
    console.log("Delivery 1: marco@delivery.com / password");
    console.log("Delivery 2: giuseppe@delivery.com / password");
    console.log("Delivery 3: antonio@delivery.com / password (unavailable)");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase(); 