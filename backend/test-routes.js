const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { readdirSync } = require('fs');
const connectDatabase = require('./utils/database');

// Set default environment variables
if (!process.env.DB) {
  process.env.DB = "mongodb://localhost:27017/orderapp";
  console.log("No DB environment variable found, using default: mongodb://localhost:27017/orderapp");
}

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "default_jwt_secret_key_for_development";
  console.log("No JWT_SECRET environment variable found, using default secret");
}

const app = express();

connectDatabase();

app.use(bodyParser.json());
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Add route logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Mount all routes
readdirSync("./routes").map((r) => {
  app.use("/api", require(`./routes/${r}`));
});

// Test route to check if server is working
app.get('/test', (req, res) => {
  res.status(200).json({ message: 'Server is working' });
});

// List all routes
app.get('/routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach(middleware => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach(handler => {
        if (handler.route) {
          routes.push({
            path: handler.route.path,
            methods: Object.keys(handler.route.methods)
          });
        }
      });
    }
  });
  res.json({ routes });
});

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Test server is running on port: ${port}`);
  console.log(`Test the following endpoints:`);
  console.log(`- GET http://localhost:${port}/test`);
  console.log(`- GET http://localhost:${port}/routes`);
  console.log(`- GET http://localhost:${port}/api/test`);
  console.log(`- GET http://localhost:${port}/api/foods`);
  console.log(`- GET http://localhost:${port}/api/orders (requires auth)`);
  console.log(`- GET http://localhost:${port}/api/delivery-men (requires auth)`);
}); 