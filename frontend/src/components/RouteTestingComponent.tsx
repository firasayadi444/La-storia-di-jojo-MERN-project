/**
 * Route Testing Component
 * Simple component to test and debug OpenRouteService route fetching
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { getSmartRoute, getFallbackRoute } from '@/services/openRouteService';
import { getOptimizedRoute } from '@/services/optimizedRouteService';
import { Route, MapPin, Loader2, AlertCircle } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface RouteTestResult {
  route: any;
  coordinates: [number, number][];
  distance: number;
  duration: number;
  waypoints: number;
  isRealRoute: boolean;
}

const RouteTestingComponent: React.FC = () => {
  const [testResult, setTestResult] = useState<RouteTestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Test coordinates
  const startPoint = { lat: 36.90272039645084, lng: 10.187488663609964 }; // Restaurant
  const endPoint = { lat: 36.8065, lng: 10.1815 }; // Customer

  // Test direct OpenRouteService call
  const testDirectORS = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      console.log('🧪 Testing direct OpenRouteService call...');
      const route = await getSmartRoute(startPoint, endPoint, 'delivery');
      
      if (route) {
        setTestResult({
          route,
          coordinates: route.coordinates,
          distance: route.distance,
          duration: route.duration,
          waypoints: route.coordinates.length,
          isRealRoute: true
        });
        console.log('✅ Direct ORS test successful:', route);
      } else {
        setError('Direct ORS call returned null');
        console.error('❌ Direct ORS call returned null');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Direct ORS test failed: ${errorMsg}`);
      console.error('❌ Direct ORS test failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Test optimized route service
  const testOptimizedRoute = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      console.log('🧪 Testing optimized route service...');
      const route = await getOptimizedRoute(startPoint, endPoint, 'delivery');
      
      if (route) {
        setTestResult({
          route,
          coordinates: route.coordinates,
          distance: route.distance,
          duration: route.duration,
          waypoints: route.coordinates.length,
          isRealRoute: true
        });
        console.log('✅ Optimized route test successful:', route);
      } else {
        setError('Optimized route call returned null');
        console.error('❌ Optimized route call returned null');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Optimized route test failed: ${errorMsg}`);
      console.error('❌ Optimized route test failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Test fallback route
  const testFallbackRoute = () => {
    setIsLoading(true);
    setError('');
    
    try {
      console.log('🧪 Testing fallback route...');
      const route = getFallbackRoute(startPoint, endPoint);
      
      setTestResult({
        route,
        coordinates: route.coordinates,
        distance: route.distance,
        duration: route.duration,
        waypoints: route.coordinates.length,
        isRealRoute: false
      });
      console.log('✅ Fallback route test successful:', route);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Fallback route test failed: ${errorMsg}`);
      console.error('❌ Fallback route test failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Show straight line for comparison
  const showStraightLine = () => {
    const straightLine = [
      [startPoint.lat, startPoint.lng],
      [endPoint.lat, endPoint.lng]
    ] as [number, number][];
    
    setTestResult({
      route: null,
      coordinates: straightLine,
      distance: 0,
      duration: 0,
      waypoints: 2,
      isRealRoute: false
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            Route Testing Component
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={testDirectORS} disabled={isLoading} size="sm">
              Test Direct ORS
            </Button>
            <Button onClick={testOptimizedRoute} disabled={isLoading} size="sm">
              Test Optimized
            </Button>
            <Button onClick={testFallbackRoute} disabled={isLoading} size="sm">
              Test Fallback
            </Button>
            <Button onClick={showStraightLine} disabled={isLoading} size="sm">
              Show Straight Line
            </Button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            </div>
          )}

          {testResult && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span>Route Type:</span>
                <Badge className={testResult.isRealRoute ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                  {testResult.isRealRoute ? "Real Route" : "Fallback/Straight"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Waypoints:</span>
                <span className="font-medium">{testResult.waypoints}</span>
              </div>
              <div className="flex justify-between">
                <span>Distance:</span>
                <span className="font-medium">{(testResult.distance / 1000).toFixed(2)} km</span>
              </div>
              <div className="flex justify-between">
                <span>Duration:</span>
                <span className="font-medium">{Math.round(testResult.duration / 60)} min</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Route Visualization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <MapContainer
              center={startPoint}
              zoom={12}
              className="h-full w-full"
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Start Point */}
              <Marker position={[startPoint.lat, startPoint.lng]}>
                <div className="text-center">
                  <div className="font-semibold">🏪 Start</div>
                  <div className="text-sm text-gray-600">Restaurant</div>
                </div>
              </Marker>
              
              {/* End Point */}
              <Marker position={[endPoint.lat, endPoint.lng]}>
                <div className="text-center">
                  <div className="font-semibold">📍 End</div>
                  <div className="text-sm text-gray-600">Customer</div>
                </div>
              </Marker>
              
              {/* Route Polyline */}
              {testResult && testResult.coordinates.length > 1 && (
                <Polyline
                  positions={testResult.coordinates}
                  color={testResult.isRealRoute ? "#10b981" : "#ef4444"}
                  weight={4}
                  opacity={0.8}
                />
              )}
            </MapContainer>
          </div>
          
          {isLoading && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Testing route...</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RouteTestingComponent;
