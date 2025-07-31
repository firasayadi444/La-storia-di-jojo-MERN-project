#!/bin/bash

echo "=== Frontend Test Diagnostic Script ==="

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
find . -name "*.test.tsx" -o -name "*.test.ts" -o -name "*.spec.tsx" -o -name "*.spec.ts" | head -10

# Check Vitest configuration
echo "Checking Vitest config:"
if [ -f "vitest.config.ts" ]; then
    echo "✅ vitest.config.ts exists"
    cat vitest.config.ts | head -10
else
    echo "❌ vitest.config.ts missing"
fi

# Check TypeScript configuration
echo "Checking TypeScript config:"
if [ -f "tsconfig.json" ]; then
    echo "✅ tsconfig.json exists"
else
    echo "❌ tsconfig.json missing"
fi

# Check environment variables
echo "Checking environment:"
echo "NODE_ENV: $NODE_ENV"
echo "VITE_API_URL: $VITE_API_URL"

echo "=== Diagnostic Complete ===" 