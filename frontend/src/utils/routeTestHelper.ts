/**
 * Route Test Helper
 * Utility functions for testing OpenRouteService integration
 */

import { getSmartRoute, getFallbackRoute, interpolateRoute } from '@/services/openRouteService';

// Test coordinates for Tunis, Tunisia
export const TEST_COORDINATES = {
  // Restaurant location (fixed in app)
  restaurant: { lat: 36.90272039645084, lng: 10.187488663609964 },
  
  // Sample customer locations in Tunis
  customer1: { lat: 36.8065, lng: 10.1815 }, // Central Tunis
  customer2: { lat: 36.8098, lng: 10.1654 }, // Northern area
  customer3: { lat: 36.7980, lng: 10.1900 }, // Southern area
  
  // Delivery person locations
  delivery1: { lat: 36.8150, lng: 10.1750 }, // Close to restaurant
  delivery2: { lat: 36.8000, lng: 10.1700 }, // Mid-route
  delivery3: { lat: 36.7900, lng: 10.1850 }, // Close to customer
};

/**
 * Test OpenRouteService integration with sample coordinates
 */
export async function testRouteIntegration() {
  console.log('🧪 Testing OpenRouteService Integration...');
  
  const testCases = [
    {
      name: 'Restaurant to Customer 1',
      start: TEST_COORDINATES.restaurant,
      end: TEST_COORDINATES.customer1,
      context: 'delivery' as const
    },
    {
      name: 'Delivery Person to Customer 2',
      start: TEST_COORDINATES.delivery1,
      end: TEST_COORDINATES.customer2,
      context: 'delivery' as const
    },
    {
      name: 'Customer 3 to Restaurant',
      start: TEST_COORDINATES.customer3,
      end: TEST_COORDINATES.restaurant,
      context: 'customer' as const
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📍 Testing: ${testCase.name}`);
    
    try {
      // Test ORS route
      const route = await getSmartRoute(testCase.start, testCase.end, testCase.context);
      
      if (route) {
        console.log('✅ ORS Route Success:', {
          distance: `${(route.distance / 1000).toFixed(2)} km`,
          duration: `${Math.round(route.duration / 60)} minutes`,
          waypoints: route.coordinates.length
        });
        
        // Test interpolation
        const interpolated = interpolateRoute(route.coordinates, 20);
        console.log(`🔄 Interpolation: ${route.coordinates.length} → ${interpolated.length} points`);
        
      } else {
        console.log('⚠️ ORS Route Failed, testing fallback...');
        const fallback = getFallbackRoute(testCase.start, testCase.end);
        console.log('✅ Fallback Route:', {
          distance: `${(fallback.distance / 1000).toFixed(2)} km`,
          duration: `${Math.round(fallback.duration / 60)} minutes`
        });
      }
      
    } catch (error) {
      console.error('❌ Test Failed:', error);
    }
  }
  
  console.log('\n🏁 Route Integration Test Complete!');
}

/**
 * Validate API key configuration
 */
export function validateConfiguration() {
  const apiKey = import.meta.env.VITE_ORS_API_KEY;
  
  console.log('🔧 Configuration Validation:');
  console.log('- API Key Present:', !!apiKey);
  console.log('- API Key Length:', apiKey ? apiKey.length : 0);
  console.log('- API Key Preview:', apiKey ? `${apiKey.substring(0, 8)}...` : 'Not set');
  
  if (!apiKey) {
    console.warn('⚠️ VITE_ORS_API_KEY not found in environment variables');
    console.log('Please add your OpenRouteService API key to frontend/.env');
    return false;
  }
  
  if (apiKey === 'your_api_key_here') {
    console.warn('⚠️ Default placeholder API key detected');
    console.log('Please replace with your actual OpenRouteService API key');
    return false;
  }
  
  console.log('✅ Configuration appears valid');
  return true;
}

/**
 * Performance test for route calculation
 */
export async function performanceTest() {
  console.log('⚡ Performance Test Starting...');
  
  const start = TEST_COORDINATES.restaurant;
  const end = TEST_COORDINATES.customer1;
  
  const iterations = 5;
  const times: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();
    
    try {
      await getSmartRoute(start, end, 'delivery');
      const endTime = performance.now();
      const duration = endTime - startTime;
      times.push(duration);
      console.log(`Request ${i + 1}: ${duration.toFixed(2)}ms`);
    } catch (error) {
      console.error(`Request ${i + 1} failed:`, error);
    }
  }
  
  if (times.length > 0) {
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    console.log('\n📊 Performance Results:');
    console.log(`Average: ${avgTime.toFixed(2)}ms`);
    console.log(`Min: ${minTime.toFixed(2)}ms`);
    console.log(`Max: ${maxTime.toFixed(2)}ms`);
    console.log(`Success Rate: ${(times.length / iterations * 100).toFixed(1)}%`);
  }
}

/**
 * Run all tests
 */
export async function runAllTests() {
  console.log('🚀 Starting OpenRouteService Integration Tests\n');
  
  // Configuration validation
  const configValid = validateConfiguration();
  if (!configValid) {
    console.log('\n❌ Configuration invalid, skipping API tests');
    return;
  }
  
  // Route integration test
  await testRouteIntegration();
  
  // Performance test
  await performanceTest();
  
  console.log('\n✅ All tests completed!');
}

// Export for use in browser console or components
if (typeof window !== 'undefined') {
  (window as any).routeTestHelper = {
    testRouteIntegration,
    validateConfiguration,
    performanceTest,
    runAllTests,
    TEST_COORDINATES
  };
  
  console.log('🔧 Route test helper available as window.routeTestHelper');
  console.log('Run window.routeTestHelper.runAllTests() to test integration');
}
