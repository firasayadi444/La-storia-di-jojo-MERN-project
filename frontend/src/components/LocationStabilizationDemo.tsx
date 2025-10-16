/**
 * Location Stabilization Demo Component
 * Demonstrates GPS stabilization with road snapping and smoothing
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { stabilizeLocation, clearLocationHistory, getStabilizationStats } from '@/services/locationStabilizer';
import { Target, MapPin, Navigation, Zap, RefreshCw } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface StabilizationDemoProps {
  center: { lat: number; lng: number };
}

const LocationStabilizationDemo: React.FC<StabilizationDemoProps> = ({ center }) => {
  const [rawLocations, setRawLocations] = useState<Array<{ lat: number; lng: number; timestamp: number }>>([]);
  const [stabilizedLocations, setStabilizedLocations] = useState<Array<{ lat: number; lng: number; timestamp: number; isSnappedToRoad: boolean }>>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState({ historySize: 0, recentSnappedCount: 0, averageAccuracy: 0 });
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Update stats
  const updateStats = () => {
    setStats(getStabilizationStats());
  };

  // Generate noisy GPS location around center point
  const generateNoisyLocation = (): { lat: number; lng: number; accuracy: number } => {
    const noiseLat = (Math.random() - 0.5) * 0.001; // ~50m noise
    const noiseLng = (Math.random() - 0.5) * 0.001;
    
    return {
      lat: center.lat + noiseLat,
      lng: center.lng + noiseLng,
      accuracy: 5 + Math.random() * 15 // 5-20m accuracy
    };
  };

  // Process a single location
  const processLocation = async () => {
    setIsProcessing(true);
    
    try {
      const noisyLocation = generateNoisyLocation();
      const timestamp = Date.now();
      
      // Add to raw locations
      setRawLocations(prev => [...prev.slice(-10), { 
        lat: noisyLocation.lat, 
        lng: noisyLocation.lng, 
        timestamp 
      }]);
      
      // Stabilize location
      console.log('📍 Processing noisy location:', noisyLocation);
      const stabilized = await stabilizeLocation(noisyLocation, {
        snapToRoad: true,
        movingAverageWindow: 5,
        noiseThresholdMeters: 10,
        maxSnapDistanceMeters: 100
      });
      
      // Add to stabilized locations
      setStabilizedLocations(prev => [...prev.slice(-10), {
        lat: stabilized.latitude,
        lng: stabilized.longitude,
        timestamp: stabilized.timestamp,
        isSnappedToRoad: stabilized.isSnappedToRoad
      }]);
      
      // Update current location
      setCurrentLocation({ lat: stabilized.latitude, lng: stabilized.longitude });
      
      updateStats();
      console.log('✅ Location processed:', {
        raw: { lat: noisyLocation.lat, lng: noisyLocation.lng },
        stabilized: { lat: stabilized.latitude, lng: stabilized.longitude },
        isSnappedToRoad: stabilized.isSnappedToRoad
      });
      
    } catch (error) {
      console.error('❌ Location processing failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Simulate continuous GPS updates
  const simulateContinuousUpdates = () => {
    const interval = setInterval(() => {
      processLocation();
    }, 2000); // Every 2 seconds
    
    // Stop after 30 seconds
    setTimeout(() => {
      clearInterval(interval);
    }, 30000);
  };

  // Clear all data
  const clearAllData = () => {
    setRawLocations([]);
    setStabilizedLocations([]);
    setCurrentLocation(null);
    clearLocationHistory();
    updateStats();
    console.log('🧹 All location data cleared');
  };

  useEffect(() => {
    updateStats();
  }, []);

  const allRawPositions = rawLocations.map(loc => [loc.lat, loc.lng] as [number, number]);
  const allStabilizedPositions = stabilizedLocations.map(loc => [loc.lat, loc.lng] as [number, number]);

  return (
    <div className="space-y-4">
      {/* Demo Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Location Stabilization Demo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button 
              onClick={processLocation} 
              disabled={isProcessing}
              className="w-full"
            >
              {isProcessing ? 'Processing...' : 'Process Location'}
            </Button>
            <Button 
              onClick={simulateContinuousUpdates} 
              variant="outline"
              className="w-full"
            >
              Simulate GPS Stream
            </Button>
          </div>
          
          <Button onClick={clearAllData} variant="secondary" className="w-full">
            Clear All Data
          </Button>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex justify-between">
              <span>History:</span>
              <Badge variant="outline">{stats.historySize}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Road Snapped:</span>
              <Badge variant="outline">{stats.recentSnappedCount}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Accuracy:</span>
              <Badge variant="outline">{stats.averageAccuracy.toFixed(1)}m</Badge>
            </div>
          </div>

          {/* Location Counts */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span>Raw Locations:</span>
              <Badge className="bg-red-100 text-red-800">{rawLocations.length}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Stabilized:</span>
              <Badge className="bg-green-100 text-green-800">{stabilizedLocations.length}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Visualization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <MapContainer
              center={center}
              zoom={16}
              className="h-full w-full"
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Center Reference */}
              <Marker position={[center.lat, center.lng]}>
                <div className="text-center">
                  <div className="font-semibold">🎯 Reference</div>
                  <div className="text-sm text-gray-600">Center Point</div>
                </div>
              </Marker>
              
              {/* Current Stabilized Location */}
              {currentLocation && (
                <Marker position={[currentLocation.lat, currentLocation.lng]}>
                  <div className="text-center">
                    <div className="font-semibold">🛣️ Current</div>
                    <div className="text-sm text-gray-600">Stabilized</div>
                  </div>
                </Marker>
              )}
              
              {/* Raw GPS Trail */}
              {allRawPositions.length > 1 && (
                <Polyline
                  positions={allRawPositions}
                  color="#ef4444"
                  weight={2}
                  opacity={0.6}
                  dashArray="3, 3"
                />
              )}
              
              {/* Stabilized Trail */}
              {allStabilizedPositions.length > 1 && (
                <Polyline
                  positions={allStabilizedPositions}
                  color="#10b981"
                  weight={3}
                  opacity={0.8}
                />
              )}
            </MapContainer>
          </div>
          
          {/* Legend */}
          <div className="mt-4 flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-red-400 border-dashed border border-red-600"></div>
              <span>Raw GPS Trail</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-green-500"></div>
              <span>Stabilized Trail</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Locations */}
      {(rawLocations.length > 0 || stabilizedLocations.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Recent Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {stabilizedLocations.slice(-5).reverse().map((loc, index) => (
                <div key={loc.timestamp} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs">
                      {new Date(loc.timestamp).toLocaleTimeString()}
                    </span>
                    <Badge className={loc.isSnappedToRoad ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>
                      {loc.isSnappedToRoad ? "Road" : "GPS"}
                    </Badge>
                  </div>
                  <div className="font-mono text-xs">
                    {loc.lat.toFixed(6)}, {loc.lng.toFixed(6)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LocationStabilizationDemo;
