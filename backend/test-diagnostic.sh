#!/bin/bash

echo "=== Test Diagnostic Script ==="

# Check Node.js environment
echo "Node.js version:"
node --version

echo "npm version:"
npm --version

# Check if dependencies are installed
echo "Checking node_modules:"
if [ -d "node_modules" ]; then
    echo "✅ node_modules exists"
    ls -la node_modules | head -5
else
    echo "❌ node_modules missing"
fi

# Check package.json
echo "Checking package.json:"
if [ -f "package.json" ]; then
    echo "✅ package.json exists"
    cat package.json | grep -E '"test"|"test:ci"'
else
    echo "❌ package.json missing"
fi

# Check test files
echo "Checking test files:"
find . -name "*.test.js" -o -name "*.spec.js" | head -10

# Check Jest configuration
echo "Checking Jest config:"
if [ -f "jest.config.js" ]; then
    echo "✅ jest.config.js exists"
elif grep -q "jest" package.json; then
    echo "✅ Jest configured in package.json"
else
    echo "❌ No Jest configuration found"
fi

# Check database connection (if needed)
echo "Checking database setup:"
if [ -f "tests/setup.js" ]; then
    echo "✅ Test setup file exists"
    cat tests/setup.js | head -10
else
    echo "❌ Test setup file missing"
fi

# Check environment variables
echo "Checking environment:"
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"

echo "=== Diagnostic Complete ===" 