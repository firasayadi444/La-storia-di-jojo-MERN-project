const mongoose = require("mongoose");
const Foods = require("./models/foodModel");
const Users = require("./models/userModel");
const bcrypt = require("bcrypt");
require("dotenv").config();

const sampleFoods = [
  {
    name: "Margherita Pizza",
    category: "Pizza",
    price: 12.99,
    description: "Fresh tomato sauce, mozzarella, and basil on a crispy crust",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop",
    available: true
  },
  {
    name: "Classic Burger",
    category: "Burgers",
    price: 9.99,
    description: "Juicy beef patty with lettuce, tomato, onion, and our special sauce",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop",
    available: true
  },
  {
    name: "Chicken Teriyaki",
    category: "Asian",
    price: 14.99,
    description: "Grilled chicken glazed with teriyaki sauce, served with steamed rice",
    image: "https://images.unsplash.com/photo-1607330289090-7e7c1e5b5b4b?w=400&h=300&fit=crop",
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
    name: "Spaghetti Carbonara",
    category: "Pasta",
    price: 13.99,
    description: "Creamy pasta with pancetta, eggs, parmesan, and black pepper",
    image: "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400&h=300&fit=crop",
    available: true
  },
  {
    name: "Fish Tacos",
    category: "Mexican",
    price: 11.99,
    description: "Grilled fish with cabbage slaw, salsa, and cilantro lime crema",
    image: "https://images.unsplash.com/photo-1565299585323-38174c6339cd?w=400&h=300&fit=crop",
    available: true
  },
  {
    name: "Chicken Wings",
    category: "Appetizers",
    price: 10.99,
    description: "Crispy wings tossed in your choice of sauce",
    image: "https://images.unsplash.com/photo-1567620832904-9fe5cf1682f0?w=400&h=300&fit=crop",
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
      }
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
      }
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
      }
    });

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