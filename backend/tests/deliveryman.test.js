const request = require('supertest');
const app = require('../server');
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');

describe('Delivery Man Management Endpoints', () => {
  let adminUser, regularUser, deliveryMan;

  beforeEach(async () => {
    // Create admin user
    const adminPassword = await bcrypt.hash('password123', 10);
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'admin'
    });

    // Create regular user
    const userPassword = await bcrypt.hash('password123', 10);
    regularUser = await User.create({
      name: 'Regular User',
      email: 'user@example.com',
      password: userPassword,
      role: 'user'
    });

    // Create delivery man with pending status for approve/reject tests
    const deliveryPassword = await bcrypt.hash('password123', 10);
    deliveryMan = await User.create({
      name: 'Delivery Man',
      email: 'delivery@example.com',
      password: deliveryPassword,
      role: 'delivery',
      status: 'pending' // Set to pending for approve/reject tests
    });
  });

  describe('POST /api/deliveryman/apply', () => {
    it('should submit delivery man application successfully', async () => {
      const response = await request(app)
        .post('/api/deliveryman/apply')
        .field('name', 'Test Delivery Man')
        .field('email', 'deliverytest@example.com')
        .field('phone', '1234567890')
        .field('vehicleType', 'Motorcycle')
        .attach('vehiclePhoto', Buffer.from('fake-photo'), 'vehicle.jpg')
        .attach('facePhoto', Buffer.from('fake-photo'), 'face.jpg')
        .attach('cinPhoto', Buffer.from('fake-photo'), 'cin.jpg')
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('submitted successfully');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/deliveryman/apply')
        .field('email', 'test@example.com')
        // Missing other required fields
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/deliveryman/apply')
        .field('name', 'Test Delivery Man')
        .field('email', 'invalid-email')
        .field('phone', '1234567890')
        .field('vehicleType', 'Motorcycle')
        .attach('vehiclePhoto', Buffer.from('fake-photo'), 'vehicle.jpg')
        .attach('facePhoto', Buffer.from('fake-photo'), 'face.jpg')
        .attach('cinPhoto', Buffer.from('fake-photo'), 'cin.jpg')
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/deliveryman/pending', () => {
    it('should get pending applications as admin', async () => {
      const token = global.generateTestToken(adminUser._id);

      const response = await request(app)
        .get('/api/deliveryman/pending')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const applications = Array.isArray(response.body) ? response.body : response.body.applications || response.body.data || [];
      expect(Array.isArray(applications)).toBe(true);
    });

    it('should return 403 for non-admin users', async () => {
      const token = global.generateTestToken(regularUser._id);

      const response = await request(app)
        .get('/api/deliveryman/pending')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/deliveryman/all', () => {
    it('should get all delivery men as admin', async () => {
      const token = global.generateTestToken(adminUser._id);

      const response = await request(app)
        .get('/api/deliveryman/all')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const deliveryMen = Array.isArray(response.body) ? response.body : response.body.deliveryMen || response.body.data || [];
      expect(Array.isArray(deliveryMen)).toBe(true);
      expect(deliveryMen.length).toBeGreaterThan(0);
    });

    it('should return 403 for non-admin users', async () => {
      const token = global.generateTestToken(regularUser._id);

      const response = await request(app)
        .get('/api/deliveryman/all')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/deliveryman/approve/:id', () => {
    it('should approve delivery man application as admin', async () => {
      const token = global.generateTestToken(adminUser._id);

      const response = await request(app)
        .post(`/api/deliveryman/approve/${deliveryMan._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('approved successfully');

      // Verify delivery man is approved
      const updatedDeliveryMan = await User.findById(deliveryMan._id);
      expect(updatedDeliveryMan.status).toBe('active');
    });

    it('should return 404 for non-existent delivery man', async () => {
      const token = global.generateTestToken(adminUser._id);
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .post(`/api/deliveryman/approve/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/deliveryman/reject/:id', () => {
    it('should reject delivery man application as admin', async () => {
      const token = global.generateTestToken(adminUser._id);

      const response = await request(app)
        .post(`/api/deliveryman/reject/${deliveryMan._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Application rejected.');
    });
  });

  describe('PUT /api/deliveryman/availability', () => {
    it('should update availability as delivery man', async () => {
      const token = global.generateTestToken(deliveryMan._id);
      const availabilityData = { isAvailable: false };

      const response = await request(app)
        .put('/api/deliveryman/availability')
        .set('Authorization', `Bearer ${token}`)
        .send(availabilityData)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Availability updated');

      // Verify availability is updated
      const updatedDeliveryMan = await User.findById(deliveryMan._id);
      expect(updatedDeliveryMan.isAvailable).toBe(false);
    });

    it('should return 403 for non-delivery users', async () => {
      const token = global.generateTestToken(regularUser._id);
      const availabilityData = { isAvailable: false };

      const response = await request(app)
        .put('/api/deliveryman/availability')
        .set('Authorization', `Bearer ${token}`)
        .send(availabilityData)
        .expect(403);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for invalid availability data', async () => {
      const token = global.generateTestToken(deliveryMan._id);
      const availabilityData = { isAvailable: 'invalid' };

      const response = await request(app)
        .put('/api/deliveryman/availability')
        .set('Authorization', `Bearer ${token}`)
        .send(availabilityData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('DELETE /api/deliveryman/:id', () => {
    it('should delete delivery man as admin', async () => {
      const token = global.generateTestToken(adminUser._id);

      const response = await request(app)
        .delete(`/api/deliveryman/${deliveryMan._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('deleted successfully');

      // Verify delivery man is deleted
      const deletedDeliveryMan = await User.findById(deliveryMan._id);
      expect(deletedDeliveryMan).toBeNull();
    });

    it('should return 404 for non-existent delivery man', async () => {
      const token = global.generateTestToken(adminUser._id);
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .delete(`/api/deliveryman/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/deliveryman/:id', () => {
    it('should get delivery man details by ID', async () => {
      const token = global.generateTestToken(adminUser._id);

      const response = await request(app)
        .get(`/api/deliveryman/${deliveryMan._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('_id', deliveryMan._id.toString());
      expect(response.body.data).toHaveProperty('name', deliveryMan.name);
      expect(response.body.data).toHaveProperty('email', deliveryMan.email);
      expect(response.body.data).toHaveProperty('role', 'delivery');
    });

    it('should return 404 for non-existent delivery man', async () => {
      const token = global.generateTestToken(adminUser._id);
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .get(`/api/deliveryman/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });
  });
}); 