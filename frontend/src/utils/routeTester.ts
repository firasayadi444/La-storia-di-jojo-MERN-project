/**
 * Route Tester Utility
 * Test OpenRouteService Directions API integration
 */

import { getSmartRoute } from '@/services/openRouteService';

// Test coordinates for Tunis, Tunisia
const TEST_COORDINATES = {
  restaurant: { lat: 36.90272039645084, lng: 10.187488663609964 },
  customer: { lat: 36.8065, lng: 10.1815 }
};

/**
 * Test OpenRouteService API with simple route
 */
export async function testRouteAPI(): Promise<void> {
  console.log('🧪 Testing OpenRouteService Directions API...');
  
  try {
    console.log('📍 Test coordinates:', TEST_COORDINATES);
    
    const route = await getSmartRoute(
      TEST_COORDINATES.restaurant,
      TEST_COORDINATES.customer,
      'delivery'
    );
    
    if (route) {
      console.log('✅ Route fetched successfully:', {
        distance: `${(route.distance / 1000).toFixed(2)} km`,
        duration: `${Math.round(route.duration / 60)} minutes`,
        waypoints: route.coordinates.length,
        firstPoint: route.coordinates[0],
        lastPoint: route.coordinates[route.coordinates.length - 1]
      });
      
      // Log first few coordinates to verify they're different from straight line
      console.log('🗺️ First 5 route coordinates:', route.coordinates.slice(0, 5));
      console.log('🗺️ Last 5 route coordinates:', route.coordinates.slice(-5));
      
    } else {
      console.error('❌ Route fetch returned null');
    }
    
  } catch (error) {
    console.error('❌ Route test failed:', error);
  }
}

/**
 * Test route with different endpoints
 */
export async function testMultipleRoutes(): Promise<void> {
  const testCases = [
    {
      name: 'Restaurant to Customer',
      start: TEST_COORDINATES.restaurant,
      end: TEST_COORDINATES.customer
    },
    {
      name: 'Short distance test',
      start: { lat: 36.8065, lng: 10.1815 },
      end: { lat: 36.8098, lng: 10.1654 }
    },
    {
      name: 'Longer distance test',
      start: { lat: 36.8065, lng: 10.1815 },
      end: { lat: 36.8150, lng: 10.1750 }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    
    try {
      const route = await getSmartRoute(testCase.start, testCase.end, 'delivery');
      
      if (route) {
        const straightLineDistance = calculateStraightLineDistance(testCase.start, testCase.end);
        const routeDistance = route.distance;
        const efficiency = ((routeDistance - straightLineDistance) / straightLineDistance * 100).toFixed(1);
        
        console.log(`✅ ${testCase.name}:`, {
          straightLine: `${(straightLineDistance / 1000).toFixed(2)} km`,
          routeDistance: `${(routeDistance / 1000).toFixed(2)} km`,
          efficiency: `${efficiency}% longer`,
          waypoints: route.coordinates.length,
          duration: `${Math.round(route.duration / 60)} min`
        });
      } else {
        console.log(`❌ ${testCase.name}: Failed to fetch route`);
      }
    } catch (error) {
      console.log(`❌ ${testCase.name}: Error -`, error);
    }
  }
}

/**
 * Calculate straight line distance between two points
 */
function calculateStraightLineDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLng = (point2.lng - point1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Run all route tests
 */
export async function runAllRouteTests(): Promise<void> {
  console.log('🚀 Starting OpenRouteService Route Tests\n');
  
  await testRouteAPI();
  await testMultipleRoutes();
  
  console.log('\n✅ All route tests completed!');
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).routeTester = {
    testRouteAPI,
    testMultipleRoutes,
    runAllRouteTests,
    TEST_COORDINATES
  };
  
  console.log('🧪 Route tester available as window.routeTester');
  console.log('Run window.routeTester.runAllRouteTests() to test routes');
}
