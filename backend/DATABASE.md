# 🗄️ Database Setup & Management

## 📋 Overview

Your OrderApp uses **MongoDB** as the database with the following collections:
- **Users** - Customers, Admins, and Delivery Personnel
- **Foods** - Menu items and food products
- **Orders** - Customer orders and delivery tracking

## 🚀 Quick Start

### 1. Start Database
```bash
# Start all services including MongoDB
docker-compose up

# Or just MongoDB
docker-compose up mongo
```

### 2. Initialize Database
```bash
# Initialize with indexes and seed data
npm run init-db

# Or manually seed data
npm run seed
```

### 3. Check Database Health
```bash
# Check database status
npm run health-check

# Or via API endpoint
curl http://localhost:5000/health
```

## 📊 Database Collections

### 👥 Users Collection
**Schema**: `userModel.js`

**User Types**:
- `user` - Regular customers
- `admin` - System administrators  
- `delivery` - Delivery personnel

**Key Fields**:
- `email` (unique)
- `role` (user/admin/delivery)
- `status` (pending/active/rejected)
- `currentLocation` (for delivery personnel)
- `isAvailable` (for delivery personnel)

**Indexes**:
- `email` (unique)
- `role`
- `status`
- `currentLocation` (2dsphere for geospatial queries)

### 🍕 Foods Collection
**Schema**: `foodModel.js`

**Key Fields**:
- `name` - Food item name
- `category` - Food category (Burgers, Salads, etc.)
- `price` - Item price
- `description` - Food description
- `image` - Food image URL
- `available` - Whether item is available

**Indexes**:
- `name`
- `category`
- `available`

### 📦 Orders Collection
**Schema**: `orderModel.js`

**Order Statuses**:
- `pending` - Order placed
- `confirmed` - Order confirmed
- `preparing` - Food being prepared
- `ready` - Food ready for delivery
- `out_for_delivery` - Being delivered
- `delivered` - Successfully delivered
- `cancelled` - Order cancelled

**Key Fields**:
- `user` - Customer reference
- `items` - Array of food items with quantities
- `totalAmount` - Order total
- `status` - Current order status
- `deliveryAddress` - Delivery address
- `deliveryMan` - Assigned delivery person
- `estimatedDeliveryTime` - Expected delivery time
- `actualDeliveryTime` - Actual delivery time

**Indexes**:
- `user`
- `status`
- `deliveryMan`
- `createdAt` (descending)

## 🔧 Database Scripts

### Available Commands

```bash
# Initialize database (indexes + seed data)
npm run init-db

# Seed data only
npm run seed

# Health check
npm run health-check

# Start development server
npm run dev

# Start production server
npm start
```

### Manual Database Operations

```bash
# Connect to MongoDB shell
docker-compose exec mongo mongosh orderapp

# Backup database
docker-compose exec mongo mongodump --db orderapp --out /backup

# Restore database
docker-compose exec mongo mongorestore --db orderapp /backup/orderapp
```

## 🌱 Seed Data

The seed script creates:

### Sample Users
- **Admin**: `admin@food.com` / `password`
- **Customer**: `user@food.com` / `password`
- **Delivery Personnel**: 
  - `marco@delivery.com` / `password`
  - `giuseppe@delivery.com` / `password`
  - `antonio@delivery.com` / `password`

### Sample Foods
- Classic Burger ($9.99)
- Caesar Salad ($8.99)
- Chocolate Cake ($6.99)

### Sample Orders
- Historical orders for analytics
- Different statuses and delivery times

## 🔍 Health Check Endpoints

### API Health Check
```bash
GET /health
```

**Response**:
```json
{
  "status": "healthy",
  "users": 5,
  "foods": 3,
  "orders": 10,
  "connection": true
}
```

### Server Test
```bash
GET /test
```

**Response**:
```json
{
  "message": "Server is working"
}
```

## 🛠️ Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   ```bash
   # Check if MongoDB is running
   docker-compose ps mongo
   
   # Check MongoDB logs
   docker-compose logs mongo
   ```

2. **Database Not Initialized**
   ```bash
   # Run initialization
   npm run init-db
   ```

3. **Seed Data Missing**
   ```bash
   # Run seed script
   npm run seed
   ```

4. **Index Creation Failed**
   ```bash
   # Recreate indexes
   npm run init-db
   ```

### Reset Database
```bash
# Stop services
docker-compose down

# Remove volumes (WARNING: This deletes all data!)
docker-compose down -v

# Start fresh
docker-compose up --build
npm run init-db
```

## 📈 Performance Tips

1. **Indexes**: All important queries are indexed
2. **Connection Pooling**: Configured in database.js
3. **Geospatial Queries**: 2dsphere index for delivery location queries
4. **Compound Queries**: Optimized for common use cases

## 🔐 Security

1. **No Authentication**: MongoDB runs without auth (development only)
2. **Network Isolation**: Services communicate via Docker network
3. **Data Validation**: Mongoose schemas validate all data
4. **Password Hashing**: User passwords are bcrypt hashed

## 📝 Environment Variables

```env
# Database
DB_URI=mongodb://mongo:27017/orderapp
NODE_ENV=development

# Authentication
JWT_SECRET=your-super-secret-jwt-key-2024

# Server
PORT=5000
``` 