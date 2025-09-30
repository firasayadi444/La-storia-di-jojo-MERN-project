const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;

// Connect to the in-memory database
beforeAll(async () => {
  // Disable server startup during tests
  process.env.NODE_ENV = 'test';
  
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  
  // Disconnect any existing connections first
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  await mongoose.connect(uri);
  console.log('Connected to test database');
});

// Clear database between tests
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    if (Object.prototype.hasOwnProperty.call(collections, key)) {
      // eslint-disable-next-line security/detect-object-injection
      const collection = collections[key];
      await collection.deleteMany();
    }
  }
});

// Disconnect and stop mongod
afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongod) {
    await mongod.stop();
  }
  console.log('Test database disconnected');
});

// Mock JWT token for testing
global.generateTestToken = (userId, role = 'user') => {
  const jwt = require('jsonwebtoken');
  const secret = process.env.JWT_SECRET || 'test-secret';
  
  // Create token with the same structure as the auth controller
  return jwt.sign(
    { _id: userId, role: role },
    secret,
    { expiresIn: '1h' }
  );
};

// Mock file upload for testing
global.mockFileUpload = () => {
  return {
    fieldname: 'image',
    originalname: 'test-image.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('fake-image-data'),
    size: 1024
  };
}; 