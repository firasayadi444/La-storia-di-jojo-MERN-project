const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { readdirSync } = require("fs");
const connectDatabase = require("./utils/database");
const app = express();

require("dotenv").config();

// Set default database connection if not provided
if (!process.env.DB) {
  process.env.DB = "mongodb://localhost:27017/orderapp";
  console.log("No DB environment variable found, using default: mongodb://localhost:27017/orderapp");
}

// Only connect to database if not in test environment
if (process.env.NODE_ENV !== 'test') {
  connectDatabase();
}

app.use(bodyParser.json());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:8082',
    'http://192.168.100.96:8080',
    'http://192.168.100.96:8081',
    'http://192.168.100.96:8082',
    'http://192.168.245.1:8080',
    'http://192.168.245.1:8081',
    'http://192.168.245.1:8082',
    'http://192.168.119.1:8080',
    'http://192.168.119.1:8081',
    'http://192.168.119.1:8082'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Add route logging middleware (only in non-test environment)
if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Test route to check if server is working
app.get('/test', (req, res) => {
  res.status(200).json({ message: 'Server is working' });
});

// Mount routes in specific order to avoid conflicts
if (process.env.NODE_ENV !== 'test') {
  console.log('Mounting routes...');
}

// Mount more specific routes first
if (process.env.NODE_ENV !== 'test') {
  console.log('Mounting auth routes...');
}
app.use("/api", require("./routes/authRoute"));

if (process.env.NODE_ENV !== 'test') {
  console.log('Mounting food routes...');
}
app.use("/api", require("./routes/foodRoute"));

if (process.env.NODE_ENV !== 'test') {
  console.log('Mounting order routes...');
}
app.use("/api", require("./routes/orderRoute"));

if (process.env.NODE_ENV !== 'test') {
  console.log('Mounting user routes...');
}
app.use("/api", require("./routes/userRoutes"));

// Mount deliveryman route with /deliveryman prefix
if (process.env.NODE_ENV !== 'test') {
  console.log('Mounting deliveryman routes...');
}
app.use("/api/deliveryman", require("./routes/deliverymanRoute"));

if (process.env.NODE_ENV !== 'test') {
  console.log('All routes mounted successfully');
}

// Add error handling middleware AFTER routes
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// 404 handler for unmatched routes
app.use('*', (req, res) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`404 - Route not found: ${req.method} ${req.path}`);
  }
  res.status(404).json({ message: 'Route not found' });
});

const port = process.env.PORT || 5000;

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
    console.log('Available routes:');
    console.log('- GET /test');
    console.log('- GET /api/foods');
    console.log('- GET /api/deliveryman/pending');
    console.log('- GET /api/deliveryman/all');
  });
}

module.exports = app;
