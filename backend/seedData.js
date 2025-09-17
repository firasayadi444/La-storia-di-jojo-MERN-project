const mongoose = require("mongoose");
const Foods = require("./models/foodModel");
const Users = require("./models/userModel");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const sampleFoods = [
  // BURGERS
  {
    name: "Classic Burger",
    category: "Burgers",
    price: 9.99,
    description: "Juicy beef patty with lettuce, tomato, onion, and our special sauce",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop",
    available: true
  },
 

  // PIZZAS
  {
    name: "Margherita Pizza",
    category: "Pizza",
    price: 12.99,
    description: "Classic tomato sauce, fresh mozzarella, and basil",
    image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400&h=300&fit=crop",
    available: true
  },
  {
    name: "Pepperoni Pizza",
    category: "Pizza",
    price: 14.99,
    description: "Spicy pepperoni with mozzarella and tomato sauce",
    image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&h=300&fit=crop",
    available: true
  },
 
  {
    name: "Quattro Stagioni",
    category: "Pizza",
    price: 18.99,
    description: "Artichokes, mushrooms, ham, and olives representing the four seasons",
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop",
    available: true
  },

  // PASTA

  {
    name: "Fettuccine Alfredo",
    category: "Pasta",
    price: 12.99,
    description: "Creamy fettuccine with parmesan cheese and butter",
    image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&h=300&fit=crop",
    available: true
  },
  {
    name: "Penne Arrabbiata",
    category: "Pasta",
    price: 11.99,
    description: "Spicy penne with tomato sauce, garlic, and red chili peppers",
    image: "https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?w=400&h=300&fit=crop",
    available: true
  },
  {
    name: "Lasagna Bolognese",
    category: "Pasta",
    price: 15.99,
    description: "Layered pasta with meat sauce, bechamel, and parmesan cheese",
    image: "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=400&h=300&fit=crop",
    available: true
  },

  // SALADS
  {
    name: "Caesar Salad",
    category: "Salads",
    price: 8.99,
    description: "Fresh romaine lettuce, croutons, parmesan cheese, and caesar dressing",
    image: "https://images.unsplash.com/photo-1551248429-40975aa4de74?w=400&h=300&fit=crop",
    available: true
  },
  {
    name: "Greek Salad",
    category: "Salads",
    price: 9.99,
    description: "Tomatoes, cucumbers, olives, feta cheese, and olive oil dressing",
    image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop",
    available: true
  },
 
  {
    name: "Quinoa Power Bowl",
    category: "Salads",
    price: 11.99,
    description: "Quinoa, kale, chickpeas, avocado, and tahini dressing",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop",
    available: true
  },

  // APPETIZERS
  {
    name: "Mozzarella Sticks",
    category: "Appetizers",
    price: 6.99,
    description: "Breaded mozzarella sticks with marinara sauce",
    image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop",
    available: true
  },
  {
    name: "Garlic Bread",
    category: "Appetizers",
    price: 4.99,
    description: "Crusty bread with garlic butter and herbs",
    image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop",
    available: true
  },
  {
    name: "Bruschetta",
    category: "Appetizers",
    price: 7.99,
    description: "Toasted bread with tomatoes, basil, and balsamic vinegar",
    image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop",
    available: true
  },

  // MAIN COURSES
  {
    name: "Grilled Salmon",
    category: "Main Courses",
    price: 18.99,
    description: "Fresh Atlantic salmon with lemon herb butter and seasonal vegetables",
    image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop",
    available: true
  },
  {
    name: "Beef Tenderloin",
    category: "Main Courses",
    price: 24.99,
    description: "8oz beef tenderloin with red wine reduction and roasted potatoes",
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop",
    available: true
  },

  {
    name: "Vegetable Stir Fry",
    category: "Main Courses",
    price: 12.99,
    description: "Fresh seasonal vegetables with tofu in ginger soy sauce",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop",
    available: true
  },

  // DESSERTS
  {
    name: "Chocolate Cake",
    category: "Desserts",
    price: 6.99,
    description: "Rich chocolate cake with chocolate ganache",
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop",
    available: true
  },
  {
    name: "Tiramisu",
    category: "Desserts",
    price: 7.99,
    description: "Classic Italian dessert with coffee-soaked ladyfingers and mascarpone",
    image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop",
    available: true
  },
  {
    name: "Cheesecake",
    category: "Desserts",
    price: 6.99,
    description: "New York style cheesecake with berry compote",
    image: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400&h=300&fit=crop",
    available: true
  },
  {
    name: "Ice Cream Sundae",
    category: "Desserts",
    price: 5.99,
    description: "Three scoops of vanilla ice cream with chocolate sauce and nuts",
    image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop",
    available: true
  },

  // BEVERAGES
  {
    name: "Fresh Orange Juice",
    category: "Beverages",
    price: 3.99,
    description: "Freshly squeezed orange juice",
    image: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=300&fit=crop",
    available: true
  },
  {
    name: "Green Tea",
    category: "Beverages",
    price: 2.99,
    description: "Premium green tea with honey",
    image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop",
    available: true
  },
  {
    name: "Sparkling Water",
    category: "Beverages",
    price: 2.49,
    description: "Refreshing sparkling water with lemon",
    image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop",
    available: true
  },

  // SOUPS
  {
    name: "Tomato Basil Soup",
    category: "Soups",
    price: 5.99,
    description: "Creamy tomato soup with fresh basil and croutons",
    image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop",
    available: true
  },

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