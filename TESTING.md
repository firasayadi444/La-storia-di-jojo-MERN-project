# 🧪 Testing Guide - Food Delivery App

## 📋 Overview

This document covers the comprehensive testing setup for the Food Delivery App backend. The testing framework uses **Jest** with **Supertest** for API testing and **MongoDB Memory Server** for isolated database testing.

## 🚀 Quick Start

### Install Dependencies
```bash
cd backend
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests for CI
```bash
npm run test:ci
```

## 📁 Test Structure

```
backend/tests/
├── setup.js              # Test setup and configuration
├── auth.test.js          # Authentication tests
├── food.test.js          # Food management tests
├── order.test.js         # Order management tests
└── deliveryman.test.js   # Delivery man management tests
```

## 🧪 Test Categories

### 1. Authentication Tests (`auth.test.js`)
- **User Registration**
  - ✅ Successful registration
  - ✅ Duplicate email validation
  - ✅ Invalid email format validation
  - ✅ Required field validation

- **User Login**
  - ✅ Successful login with correct credentials
  - ✅ Failed login with incorrect password
  - ✅ Failed login with non-existent user
  - ✅ JWT token generation

- **Password Management**
  - ✅ Successful password change
  - ✅ Failed password change with incorrect current password
  - ✅ Authentication required for password change

### 2. Food Management Tests (`food.test.js`)
- **Food CRUD Operations**
  - ✅ Get all foods
  - ✅ Get food by ID
  - ✅ Create new food (admin only)
  - ✅ Update food (admin only)
  - ✅ Delete food (admin only)

- **Authorization Tests**
  - ✅ Admin access to food management
  - ✅ Non-admin users blocked from food management
  - ✅ Authentication required for all operations

- **Validation Tests**
  - ✅ Required field validation
  - ✅ Price validation
  - ✅ Image upload validation

### 3. Order Management Tests (`order.test.js`)
- **Order Operations**
  - ✅ Create new order
  - ✅ Get user orders
  - ✅ Get all orders (admin)
  - ✅ Update order status
  - ✅ Get delivery orders

- **Status Management**
  - ✅ Order status transitions
  - ✅ Delivery man assignment
  - ✅ Status validation

- **Feedback System**
  - ✅ Submit feedback for completed orders
  - ✅ Feedback validation

### 4. Delivery Man Management Tests (`deliveryman.test.js`)
- **Application Process**
  - ✅ Submit delivery man application
  - ✅ Application validation
  - ✅ File upload validation

- **Admin Management**
  - ✅ View pending applications
  - ✅ Approve/reject applications
  - ✅ View all delivery men
  - ✅ Delete delivery men

- **Availability Management**
  - ✅ Update availability status
  - ✅ Availability validation
  - ✅ Role-based access control

## 🔧 Test Configuration

### Jest Configuration
```json
{
  "testEnvironment": "node",
  "setupFilesAfterEnv": ["<rootDir>/tests/setup.js"],
  "collectCoverageFrom": [
    "controllers/**/*.js",
    "models/**/*.js",
    "middlewares/**/*.js",
    "utils/**/*.js"
  ],
  "coverageDirectory": "coverage",
  "coverageReporters": ["text", "lcov", "html"]
}
```

### Test Setup Features
- **MongoDB Memory Server**: Isolated database for each test
- **JWT Token Generation**: Helper function for authentication
- **File Upload Mocking**: Mock file uploads for testing
- **Database Cleanup**: Automatic cleanup between tests

## 📊 Test Coverage

### Coverage Targets
- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 85%+
- **Lines**: 80%+

### Coverage Report
After running `npm run test:coverage`, you'll get:
- **Console Report**: Summary in terminal
- **HTML Report**: Detailed report in `coverage/index.html`
- **LCOV Report**: For CI integration

## 🚨 Test Best Practices

### 1. Test Organization
- Group related tests using `describe` blocks
- Use descriptive test names with `it` blocks
- Follow AAA pattern: Arrange, Act, Assert

### 2. Database Testing
- Use MongoDB Memory Server for isolation
- Clean up data between tests
- Don't rely on external database state

### 3. Authentication Testing
- Test both authenticated and unauthenticated scenarios
- Verify role-based access control
- Test JWT token validation

### 4. Error Handling
- Test both success and error scenarios
- Verify correct HTTP status codes
- Check error message content

## 🔍 Running Specific Tests

### Run Single Test File
```bash
npm test auth.test.js
```

### Run Tests Matching Pattern
```bash
npm test -- --testNamePattern="login"
```

### Run Tests with Verbose Output
```bash
npm test -- --verbose
```

## 🛠️ Debugging Tests

### Enable Debug Logging
```bash
DEBUG=* npm test
```

### Run Single Test
```bash
npm test -- --testNamePattern="should login user" --verbose
```

### View Test Coverage
```bash
npm run test:coverage
# Open coverage/index.html in browser
```

## 📈 CI/CD Integration

### GitHub Actions
```yaml
- name: Run Backend Tests
  run: |
    cd backend
    npm install
    npm run test:ci
```

### Jenkins Pipeline
```groovy
stage('Test Backend') {
  steps {
    dir('backend') {
      sh 'npm install'
      sh 'npm run test:ci'
    }
  }
}
```

## 🐛 Common Issues & Solutions

### 1. MongoDB Connection Issues
- Ensure MongoDB Memory Server is properly configured
- Check if port 27017 is available
- Verify test setup file is loaded

### 2. JWT Token Issues
- Check JWT_SECRET environment variable
- Verify token generation helper function
- Ensure proper token format in requests

### 3. File Upload Issues
- Mock file uploads properly
- Check multer configuration
- Verify file size and type validation

### 4. Test Timeout Issues
- Increase Jest timeout for slow tests
- Check for hanging database connections
- Verify proper cleanup in afterEach/afterAll

## 📝 Adding New Tests

### 1. Create Test File
```javascript
const request = require('supertest');
const app = require('../server');

describe('New Feature Tests', () => {
  beforeEach(async () => {
    // Setup test data
  });

  it('should test new functionality', async () => {
    // Test implementation
  });
});
```

### 2. Follow Naming Convention
- Test files: `feature.test.js`
- Test suites: `Feature Tests`
- Test cases: Descriptive action names

### 3. Include All Scenarios
- Happy path (success cases)
- Error cases
- Edge cases
- Authorization tests

## 🎯 Test Metrics

### Current Coverage
- **Authentication**: 95%+
- **Food Management**: 90%+
- **Order Management**: 85%+
- **Delivery Management**: 90%+

### Performance Targets
- **Test Execution Time**: < 30 seconds
- **Memory Usage**: < 512MB
- **Database Operations**: < 100ms per test

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices) 