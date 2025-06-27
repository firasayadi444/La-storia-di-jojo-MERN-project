const request = require('supertest');
const app = require('../server');
const Order = require('../models/orderModel');
const Food = require('../models/foodModel');
const User = require('../models/userModel');

describe('Order Management Endpoints', () => {
  let customer, adminUser, deliveryMan, testFood, testOrder;

  beforeEach(async () => {
    // Create test users
    customer = await User.create({
      name: 'Test Customer',
      email: 'customer@example.com',
      password: 'password123',
      role: 'user'
    });

    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin'
    });

    deliveryMan = await User.create({
      name: 'Delivery Man',
      email: 'delivery@example.com',
      password: 'password123',
      role: 'delivery'
    });

    // Create test food
    testFood = await Food.create({
      name: 'Test Pizza',
      description: 'Delicious test pizza',
      price: 15.99,
      category: 'Pizza',
      image: 'test-pizza.jpg',
      available: true
    });

    // Create test order
    testOrder = await Order.create({
      user: customer._id,
      items: [{
        food: testFood._id,
        quantity: 2,
        price: testFood.price
      }],
      totalAmount: testFood.price * 2,
      deliveryAddress: '123 Test Street',
      status: 'pending'
    });
  });

  describe('POST /api/order/new', () => {
    it('should create a new order successfully', async () => {
      const token = global.generateTestToken(customer._id);
      const orderData = {
        items: [{
          food: testFood._id,
          quantity: 1,
          price: testFood.price
        }],
        totalAmount: testFood.price,
        deliveryAddress: '456 New Street'
      };

      const response = await request(app)
        .post('/api/order/new')
        .set('Authorization', `Bearer ${token}`)
        .send(orderData)
        .expect(201);

      expect(response.body).toHaveProperty('order');
      if (typeof response.body.order.user === 'string') {
        expect(response.body.order.user).toBe(customer._id.toString());
      } else {
        expect(response.body.order.user).toHaveProperty('_id', customer._id.toString());
      }
      expect(response.body.order).toHaveProperty('status', 'pending');
      expect(response.body.order).toHaveProperty('totalAmount', orderData.totalAmount);
    });

    it('should return 401 without authentication', async () => {
      const orderData = {
        items: [{
          food: testFood._id,
          quantity: 1,
          price: testFood.price
        }],
        totalAmount: testFood.price,
        deliveryAddress: '456 New Street'
      };

      const response = await request(app)
        .post('/api/order/new')
        .send(orderData)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for invalid order data', async () => {
      const token = global.generateTestToken(customer._id);
      const orderData = {
        items: [],
        totalAmount: 0,
        deliveryAddress: ''
      };

      const response = await request(app)
        .post('/api/order/new')
        .set('Authorization', `Bearer ${token}`)
        .send(orderData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/orders/user', () => {
    it('should get user orders successfully', async () => {
      const token = global.generateTestToken(customer._id);

      const response = await request(app)
        .get('/api/orders/user')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const orders = Array.isArray(response.body) ? response.body : response.body.orders || [];
      expect(Array.isArray(orders)).toBe(true);
      expect(orders.length).toBeGreaterThan(0);
      if (typeof orders[0].user === 'string') {
        expect(orders[0].user).toBe(customer._id.toString());
      } else {
        expect(orders[0].user).toHaveProperty('_id', customer._id.toString());
      }
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/orders/user')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/orders', () => {
    it('should get all orders as admin', async () => {
      const token = global.generateTestToken(adminUser._id);

      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const orders = Array.isArray(response.body) ? response.body : response.body.orders || [];
      expect(Array.isArray(orders)).toBe(true);
      expect(orders.length).toBeGreaterThan(0);
    });

    it('should return 403 for non-admin users', async () => {
      const token = global.generateTestToken(customer._id);

      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('PUT /api/orders/:id/status', () => {
    it('should update order status as admin', async () => {
      const token = global.generateTestToken(adminUser._id);
      const updateData = {
        status: 'confirmed',
        deliveryManId: deliveryMan._id
      };

      const response = await request(app)
        .put(`/api/orders/${testOrder._id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('order');
      expect(response.body.order).toHaveProperty('status', 'confirmed');
      if (typeof response.body.order.deliveryMan === 'string') {
        expect(response.body.order.deliveryMan).toBe(deliveryMan._id.toString());
      } else if (response.body.order.deliveryMan) {
        expect(response.body.order.deliveryMan).toHaveProperty('_id', deliveryMan._id.toString());
      }
    });

    it('should update order status as delivery man', async () => {
      // First assign order to delivery man
      testOrder.deliveryMan = deliveryMan._id;
      testOrder.status = 'ready';
      await testOrder.save();

      const token = global.generateTestToken(deliveryMan._id);
      const updateData = {
        status: 'out_for_delivery'
      };

      const response = await request(app)
        .put(`/api/orders/${testOrder._id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('order');
      expect(response.body.order).toHaveProperty('status', 'out_for_delivery');
    });

    it('should return 404 for non-existent order', async () => {
      const token = global.generateTestToken(adminUser._id);
      const fakeId = '507f1f77bcf86cd799439011';
      const updateData = {
        status: 'confirmed'
      };

      const response = await request(app)
        .put(`/api/orders/${fakeId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/orders/delivery', () => {
    it('should get delivery orders for delivery man', async () => {
      // Assign order to delivery man and set status to ready
      testOrder.deliveryMan = deliveryMan._id;
      testOrder.status = 'ready';
      await testOrder.save();

      const token = global.generateTestToken(deliveryMan._id);

      const response = await request(app)
        .get('/api/orders/delivery')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const orders = Array.isArray(response.body) ? response.body : response.body.orders || [];
      expect(Array.isArray(orders)).toBe(true);
      expect(orders.length).toBeGreaterThan(0);
    });

    it('should return 403 for non-delivery users', async () => {
      const token = global.generateTestToken(customer._id);

      const response = await request(app)
        .get('/api/orders/delivery')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/orders/:id/feedback', () => {
    it('should submit feedback for completed order', async () => {
      // Set order as delivered
      testOrder.status = 'delivered';
      await testOrder.save();

      const token = global.generateTestToken(customer._id);
      const feedbackData = {
        rating: 5,
        comment: 'Great service!'
      };

      const response = await request(app)
        .post(`/api/orders/${testOrder._id}/feedback`)
        .set('Authorization', `Bearer ${token}`)
        .send(feedbackData)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Feedback submitted');
    });

    it('should return 400 for non-delivered order', async () => {
      const token = global.generateTestToken(customer._id);
      const feedbackData = {
        rating: 5,
        comment: 'Great service!'
      };

      const response = await request(app)
        .post(`/api/orders/${testOrder._id}/feedback`)
        .set('Authorization', `Bearer ${token}`)
        .send(feedbackData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });
}); 