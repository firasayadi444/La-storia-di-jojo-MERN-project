const request = require('supertest');
const app = require('../server');
const Food = require('../models/foodModel');
const User = require('../models/userModel');

describe('Food Management Endpoints', () => {
  let adminUser, regularUser, testFood;

  beforeEach(async () => {
    // Create admin user
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin'
    });

    // Create regular user
    regularUser = await User.create({
      name: 'Regular User',
      email: 'user@example.com',
      password: 'password123',
      role: 'user'
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
  });

  describe('GET /api/foods', () => {
    it('should get all foods successfully', async () => {
      const response = await request(app)
        .get('/api/foods')
        .expect(200);
      // Accept both array and object with foods property
      const foods = Array.isArray(response.body) ? response.body : response.body.foods || [];
      expect(Array.isArray(foods)).toBe(true);
      expect(foods.length).toBeGreaterThan(0);
      expect(foods[0]).toHaveProperty('name');
      expect(foods[0]).toHaveProperty('price');
    });

    it('should return foods with correct structure', async () => {
      const response = await request(app)
        .get('/api/foods')
        .expect(200);
      const foods = Array.isArray(response.body) ? response.body : response.body.foods || [];
      const food = foods[0];
      expect(food).toHaveProperty('_id');
      expect(food).toHaveProperty('name');
      expect(food).toHaveProperty('description');
      expect(food).toHaveProperty('price');
      expect(food).toHaveProperty('category');
      expect(food).toHaveProperty('image');
      expect(food).toHaveProperty('available');
    });
  });

  describe('GET /api/food/:id', () => {
    it('should get food details by ID', async () => {
      const response = await request(app)
        .get(`/api/food/${testFood._id}`)
        .expect(200);

      expect(response.body).toHaveProperty('food');
      expect(response.body.food).toHaveProperty('_id', testFood._id.toString());
      expect(response.body.food).toHaveProperty('name', testFood.name);
      expect(response.body.food).toHaveProperty('price', testFood.price);
    });

    it('should return 404 for non-existent food', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/food/${fakeId}`)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/food/new', () => {
    it('should create new food as admin', async () => {
      const token = global.generateTestToken(adminUser._id);
      const foodData = {
        name: 'New Pizza',
        description: 'Amazing new pizza',
        price: 20.99,
        category: 'Pizza',
        image: global.mockFileUpload()
      };

      const response = await request(app)
        .post('/api/food/new')
        .set('Authorization', `Bearer ${token}`)
        .field('name', foodData.name)
        .field('description', foodData.description)
        .field('price', foodData.price)
        .field('category', foodData.category)
        .attach('image', Buffer.from('fake-image-data'), 'pizza.jpg')
        .expect(201);

      expect(response.body).toHaveProperty('food');
      expect(response.body.food).toHaveProperty('name', foodData.name);
      expect(response.body.food).toHaveProperty('price', foodData.price);
    });

    it('should return 403 for non-admin users', async () => {
      const token = global.generateTestToken(regularUser._id);
      const foodData = {
        name: 'New Pizza',
        description: 'Amazing new pizza',
        price: 20.99,
        category: 'Pizza'
      };

      const response = await request(app)
        .post('/api/food/new')
        .set('Authorization', `Bearer ${token}`)
        .send(foodData)
        .expect(403);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 without authentication', async () => {
      const foodData = {
        name: 'New Pizza',
        description: 'Amazing new pizza',
        price: 20.99,
        category: 'Pizza'
      };

      const response = await request(app)
        .post('/api/food/new')
        .send(foodData)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('PUT /api/food/:id', () => {
    it('should update food as admin', async () => {
      const token = global.generateTestToken(adminUser._id);
      const updateData = {
        name: 'Updated Pizza',
        price: 25.99,
        available: false
      };

      const response = await request(app)
        .put(`/api/food/${testFood._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('food');
      expect(response.body.food).toHaveProperty('name', updateData.name);
      expect(response.body.food).toHaveProperty('price', updateData.price);
      expect(response.body.food).toHaveProperty('available', updateData.available);
    });

    it('should return 404 for non-existent food', async () => {
      const token = global.generateTestToken(adminUser._id);
      const fakeId = '507f1f77bcf86cd799439011';
      const updateData = {
        name: 'Updated Pizza',
        price: 25.99
      };

      const response = await request(app)
        .put(`/api/food/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('DELETE /api/food/:id', () => {
    it('should delete food as admin', async () => {
      const token = global.generateTestToken(adminUser._id);

      const response = await request(app)
        .delete(`/api/food/${testFood._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('deleted');

      // Verify food is deleted
      const deletedFood = await Food.findById(testFood._id);
      expect(deletedFood).toBeNull();
    });

    it('should return 403 for non-admin users', async () => {
      const token = global.generateTestToken(regularUser._id);

      const response = await request(app)
        .delete(`/api/food/${testFood._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body).toHaveProperty('message');
    });
  });
}); 