const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../models/userModel');
const Order = require('../models/orderModel');

describe('Customer Location Tracking', () => {
  let customerToken;
  let deliveryToken;
  let adminToken;
  let customerId;
  let deliveryId;
  let orderId;

  beforeAll(async () => {
    // Create test customer
    const customer = new User({
      name: 'Test Customer',
      email: 'customer@test.com',
      password: 'password123',
      role: 'user',
      phone: '1234567890'
    });
    await customer.save();
    customerId = customer._id;

    // Create test delivery person
    const delivery = new User({
      name: 'Test Delivery',
      email: 'delivery@test.com',
      password: 'password123',
      role: 'delivery',
      phone: '0987654321',
      status: 'active'
    });
    await delivery.save();
    deliveryId = delivery._id;

    // Create test admin
    const admin = new User({
      name: 'Test Admin',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin'
    });
    await admin.save();

    // Get auth tokens (simplified for testing)
    customerToken = 'test-customer-token';
    deliveryToken = 'test-delivery-token';
    adminToken = 'test-admin-token';
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Order.deleteMany({});
    await mongoose.connection.close();
  });

  describe('Order Creation with Customer Location', () => {
    it('should create order with customer location data', async () => {
      const orderData = {
        items: [
          {
            food: new mongoose.Types.ObjectId(),
            quantity: 2,
            price: 15.99
          }
        ],
        totalAmount: 31.98,
        deliveryAddress: '123 Test Street, Test City',
        paymentMethod: 'cash',
        customerLocation: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10
        }
      };

      const response = await request(app)
        .post('/api/orders/order/new')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(orderData);

      expect(response.status).toBe(201);
      expect(response.body.order.customerLocation).toBeDefined();
      expect(response.body.order.customerLocation.latitude).toBe(40.7128);
      expect(response.body.order.customerLocation.longitude).toBe(-74.0060);
      expect(response.body.order.customerLocation.accuracy).toBe(10);
      
      orderId = response.body.order._id;
    });

    it('should reject order without customer location', async () => {
      const orderData = {
        items: [
          {
            food: new mongoose.Types.ObjectId(),
            quantity: 1,
            price: 10.99
          }
        ],
        totalAmount: 10.99,
        deliveryAddress: '123 Test Street, Test City',
        paymentMethod: 'cash'
        // No customerLocation provided
      };

      const response = await request(app)
        .post('/api/orders/order/new')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(orderData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Customer location is required');
    });

    it('should reject order with invalid location data', async () => {
      const orderData = {
        items: [
          {
            food: new mongoose.Types.ObjectId(),
            quantity: 1,
            price: 10.99
          }
        ],
        totalAmount: 10.99,
        deliveryAddress: '123 Test Street, Test City',
        paymentMethod: 'cash',
        customerLocation: {
          latitude: 'invalid',
          longitude: -74.0060
        }
      };

      const response = await request(app)
        .post('/api/orders/order/new')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(orderData);

      expect(response.status).toBe(400);
    });
  });

  describe('Customer Location Retrieval', () => {
    it('should allow customer to view their own order location', async () => {
      const response = await request(app)
        .get(`/api/orders/${orderId}/customer-location`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.customerLocation).toBeDefined();
      expect(response.body.customerLocation.latitude).toBe(40.7128);
      expect(response.body.customerLocation.longitude).toBe(-74.0060);
    });

    it('should allow delivery person to view assigned order location', async () => {
      // First assign the order to delivery person
      await Order.findByIdAndUpdate(orderId, {
        deliveryMan: deliveryId,
        status: 'out_for_delivery'
      });

      const response = await request(app)
        .get(`/api/orders/${orderId}/customer-location`)
        .set('Authorization', `Bearer ${deliveryToken}`);

      expect(response.status).toBe(200);
      expect(response.body.customerLocation).toBeDefined();
    });

    it('should allow admin to view any order location', async () => {
      const response = await request(app)
        .get(`/api/orders/${orderId}/customer-location`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.customerLocation).toBeDefined();
    });

    it('should deny access to unauthorized users', async () => {
      const unauthorizedUser = new User({
        name: 'Unauthorized User',
        email: 'unauthorized@test.com',
        password: 'password123',
        role: 'user'
      });
      await unauthorizedUser.save();

      const response = await request(app)
        .get(`/api/orders/${orderId}/customer-location`)
        .set('Authorization', `Bearer unauthorized-token`);

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent order', async () => {
      const fakeOrderId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/orders/${fakeOrderId}/customer-location`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('Order Display with Location', () => {
    it('should include customer location in order list for delivery person', async () => {
      const response = await request(app)
        .get('/api/orders/delivery')
        .set('Authorization', `Bearer ${deliveryToken}`);

      expect(response.status).toBe(200);
      expect(response.body.orders).toBeDefined();
      
      const orderWithLocation = response.body.orders.find(order => order._id === orderId);
      expect(orderWithLocation).toBeDefined();
      expect(orderWithLocation.customerLocation).toBeDefined();
    });

    it('should include customer location in admin order list', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.orders).toBeDefined();
      
      const orderWithLocation = response.body.orders.find(order => order._id === orderId);
      expect(orderWithLocation).toBeDefined();
      expect(orderWithLocation.customerLocation).toBeDefined();
    });
  });
});
