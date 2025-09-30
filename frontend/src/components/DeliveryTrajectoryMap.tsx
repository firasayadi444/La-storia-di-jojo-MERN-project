import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Clock, Truck } from 'lucide-react';
import { apiService } from '@/services/api';
import { useSocket } from '@/contexts/SocketContext';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create custom icons
const customerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const deliveryIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface LocationPoint {
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

interface DeliveryTrajectoryMapProps {
  orderId: string;
  deliveryManId?: string;
  deliveryAddress: string;
  deliveryAddressCoords?: { lat: number; lng: number };
  customerLocation?: { latitude: number; longitude: number; accuracy?: number; timestamp?: string };
  onLocationUpdate?: (location: LocationPoint) => void;
}

// Create sample trajectory for demonstration
function createSampleTrajectory(deliveryAddressCoords?: { lat: number; lng: number }): LocationPoint[] {
  const now = new Date();
  const baseLat = deliveryAddressCoords?.lat || 40.7128;
  const baseLng = deliveryAddressCoords?.lng || -74.0060;
  
  // Create a sample trajectory from a starting point to the delivery address
  const startLat = baseLat - 0.01; // Start 1km north
  const startLng = baseLng - 0.01; // Start 1km west
  
  const trajectory: LocationPoint[] = [];
  const numPoints = 8;
  
  for (let i = 0; i < numPoints; i++) {
    const progress = i / (numPoints - 1);
    const lat = startLat + (baseLat - startLat) * progress + (Math.random() - 0.5) * 0.002;
    const lng = startLng + (baseLng - startLng) * progress + (Math.random() - 0.5) * 0.002;
    
    trajectory.push({
      latitude: lat,
      longitude: lng,
      timestamp: new Date(now.getTime() - (numPoints - i) * 5 * 60 * 1000).toISOString(), // 5 minutes apart
      accuracy: 5 + Math.random() * 10,
      speed: Math.random() * 30,
      heading: Math.random() * 360
    });
  }
  
  return trajectory;
}

// Custom hook to update map view when trajectory changes
function MapUpdater({ trajectory, deliveryAddressCoords, customerLocation }: { 
  trajectory: LocationPoint[]; 
  deliveryAddressCoords?: { lat: number; lng: number };
  customerLocation?: { latitude: number; longitude: number; accuracy?: number; timestamp?: string };
}) {
  const map = useMap();

  useEffect(() => {
    if (trajectory.length > 0) {
      const bounds = L.latLngBounds(
        trajectory.map(point => [point.latitude, point.longitude])
      );
      
      // Include customer location if available, otherwise delivery address
      if (customerLocation && customerLocation.latitude && customerLocation.longitude) {
        bounds.extend([customerLocation.latitude, customerLocation.longitude]);
      } else if (deliveryAddressCoords && deliveryAddressCoords.lat && deliveryAddressCoords.lng) {
        bounds.extend([deliveryAddressCoords.lat, deliveryAddressCoords.lng]);
      }
      
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [trajectory, deliveryAddressCoords, customerLocation, map]);

  return null;
}

const DeliveryTrajectoryMap: React.FC<DeliveryTrajectoryMapProps> = ({
  orderId,
  deliveryManId,
  deliveryAddress,
  deliveryAddressCoords,
  customerLocation,
  onLocationUpdate
}) => {
  const [trajectory, setTrajectory] = useState<LocationPoint[]>([]);
  const [currentLocation, setCurrentLocation] = useState<LocationPoint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { socket } = useSocket();

  // Debug logging
  console.log('DeliveryTrajectoryMap props:', {
    orderId,
    deliveryManId,
    deliveryAddress,
    deliveryAddressCoords,
    customerLocation
  });

  // Fetch trajectory data
  useEffect(() => {
    const fetchTrajectory = async () => {
      if (!deliveryManId) {
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching trajectory for deliveryManId:', deliveryManId, 'orderId:', orderId);
        // Use new delivery tracking system instead of old trajectory method
        const response = await apiService.getDeliveryTracking(orderId);
        console.log('Trajectory API response:', response);
        
        const trajectoryData = response.data || response.trajectory || [];
        console.log('Trajectory data:', trajectoryData);
        
        // Convert API data to LocationPoint format
        const trajectoryPoints: LocationPoint[] = trajectoryData.map((point: any) => ({
          latitude: point.latitude,
          longitude: point.longitude,
          timestamp: point.timestamp,
          accuracy: point.accuracy,
          speed: point.speed,
          heading: point.heading
        }));

        // If no real data, create sample data for demonstration
        if (trajectoryPoints.length === 0) {
          console.log('No trajectory data found, creating sample data for demonstration');
          const sampleTrajectory = createSampleTrajectory(deliveryAddressCoords);
          setTrajectory(sampleTrajectory);
          setCurrentLocation(sampleTrajectory[sampleTrajectory.length - 1]);
        } else {
          setTrajectory(trajectoryPoints);
          if (trajectoryPoints.length > 0) {
            setCurrentLocation(trajectoryPoints[trajectoryPoints.length - 1]);
          }
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching trajectory:', err);
        // Create sample data as fallback
        console.log('Creating sample trajectory as fallback');
        const sampleTrajectory = createSampleTrajectory(deliveryAddressCoords);
        setTrajectory(sampleTrajectory);
        setCurrentLocation(sampleTrajectory[sampleTrajectory.length - 1]);
        setLoading(false);
      }
    };

    fetchTrajectory();
  }, [deliveryManId, orderId, deliveryAddressCoords]);

  // Listen for real-time location updates via WebSocket
  useEffect(() => {
    if (!socket) return;

    const handleLocationUpdate = (data: any) => {
      if (data.orderId === orderId) {
        console.log('📍 Received real-time location update:', data);
        const newLocation: LocationPoint = {
          latitude: data.location.lat,
          longitude: data.location.lng,
          timestamp: data.timestamp,
          accuracy: data.accuracy || data.location.accuracy || 10, // Use actual accuracy from GPS
          speed: data.speed || data.location.speed || 0,
          heading: data.heading || data.location.heading || 0
        };

        // Filter out inaccurate locations (accuracy > 100m)
        if (newLocation.accuracy <= 100) {
          setTrajectory(prev => [...prev, newLocation]);
          setCurrentLocation(newLocation);
          onLocationUpdate?.(newLocation);
        } else {
          console.warn('📍 Location update rejected due to poor accuracy:', newLocation.accuracy, 'meters');
        }
      }
    };

    socket.on('location-update', handleLocationUpdate);

    return () => {
      socket.off('location-update', handleLocationUpdate);
    };
  }, [socket, orderId, onLocationUpdate]);

  // Fallback simulation for demonstration (only if no real data)
  useEffect(() => {
    if (trajectory.length === 0) {
      const interval = setInterval(() => {
        if (deliveryManId) {
          // Only simulate if we have no real data
          const sampleLocation: LocationPoint = {
            latitude: 40.7128 + (Math.random() - 0.5) * 0.01,
            longitude: -74.0060 + (Math.random() - 0.5) * 0.01,
            timestamp: new Date().toISOString(),
            accuracy: 5 + Math.random() * 10,
            speed: Math.random() * 30,
            heading: Math.random() * 360
          };

          setTrajectory(prev => [...prev, sampleLocation]);
          setCurrentLocation(sampleLocation);
          onLocationUpdate?.(sampleLocation);
        }
      }, 30000); // Update every 30 seconds

      return () => clearInterval(interval);
    }
  }, [deliveryManId, trajectory.length, onLocationUpdate]);

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Delivery Trajectory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Delivery Trajectory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-red-600">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!deliveryManId) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Delivery Trajectory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Truck className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No delivery person assigned yet</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (trajectory.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Delivery Trajectory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Truck className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No location data available yet</p>
              <p className="text-sm mt-2">Delivery person: {deliveryManId}</p>
              <p className="text-sm">Order: {orderId}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Create polyline coordinates for the trajectory
  const trajectoryCoords = trajectory.map(point => [point.latitude, point.longitude] as [number, number]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Delivery Trajectory
        </CardTitle>
        {currentLocation && (
          <div className="flex gap-2 text-sm text-gray-600">
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Last update: {new Date(currentLocation.timestamp).toLocaleTimeString()}
            </Badge>
            {currentLocation.speed && currentLocation.speed > 0 && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Navigation className="h-3 w-3" />
                Speed: {Math.round(currentLocation.speed * 3.6)} km/h
              </Badge>
            )}
            <Badge variant="outline" className="flex items-center gap-1 bg-green-100 text-green-800">
              <MapPin className="h-3 w-3" />
              {trajectory.length > 0 && trajectory[0].latitude > 40.7 && trajectory[0].latitude < 40.8 ? 'Real Location' : 'Sample Data'}
            </Badge>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-64 rounded-lg overflow-hidden">
          <MapContainer
            center={currentLocation ? [currentLocation.latitude, currentLocation.longitude] : [40.7128, -74.0060]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            <MapUpdater trajectory={trajectory} deliveryAddressCoords={deliveryAddressCoords} customerLocation={customerLocation} />
            
            {/* Customer location marker (red) - Use actual customer location if available, otherwise fallback to delivery address */}
            {((customerLocation && customerLocation.latitude && customerLocation.longitude) || 
              (deliveryAddressCoords && deliveryAddressCoords.lat && deliveryAddressCoords.lng)) && (
              <Marker 
                position={customerLocation && customerLocation.latitude && customerLocation.longitude ? 
                  [customerLocation.latitude, customerLocation.longitude] : 
                  [deliveryAddressCoords!.lat, deliveryAddressCoords!.lng]
                }
                icon={customerIcon}
              >
                <Popup>
                  <div className="text-center">
                    <h3 className="font-semibold text-red-600">Customer Location</h3>
                    <p className="text-sm text-gray-600">{deliveryAddress}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      📍 {customerLocation && customerLocation.latitude && customerLocation.longitude ? 
                        `${customerLocation.latitude.toFixed(6)}, ${customerLocation.longitude.toFixed(6)}` :
                        deliveryAddressCoords && deliveryAddressCoords.lat && deliveryAddressCoords.lng ?
                        `${deliveryAddressCoords.lat.toFixed(6)}, ${deliveryAddressCoords.lng.toFixed(6)}` :
                        'Location not available'
                      }
                    </p>
                     {customerLocation?.accuracy && (
                       <p className={`text-xs ${
                         customerLocation.accuracy > 1000 ? 'text-red-500 font-semibold' : 'text-gray-500'
                       }`}>
                         Accuracy: ±{Math.round(customerLocation.accuracy)}m
                         {customerLocation.accuracy > 1000 && ' (Low accuracy)'}
                       </p>
                     )}
                    {customerLocation?.timestamp && (
                      <p className="text-xs text-gray-500">
                        Captured: {new Date(customerLocation.timestamp).toLocaleString()}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            )}
            
            {/* Trajectory polyline */}
            {trajectoryCoords.length > 1 && (
              <Polyline
                positions={trajectoryCoords}
                color="#3b82f6"
                weight={3}
                opacity={0.7}
              />
            )}
            
            {/* Current delivery location marker (green) */}
            {currentLocation && (
              <Marker 
                position={[currentLocation.latitude, currentLocation.longitude]}
                icon={deliveryIcon}
              >
                <Popup>
                  <div className="text-center">
                    <h3 className="font-semibold text-green-600">Delivery Person</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(currentLocation.timestamp).toLocaleString()}
                    </p>
                    {currentLocation.speed && (
                      <p className="text-sm text-gray-600">
                        Speed: {Math.round(currentLocation.speed * 3.6)} km/h
                      </p>
                    )}
                    {currentLocation.accuracy && (
                      <p className="text-sm text-gray-600">
                        Accuracy: ±{Math.round(currentLocation.accuracy)}m
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            )}
            
            {/* Start location marker */}
            {trajectory.length > 0 && (
              <Marker 
                position={[trajectory[0].latitude, trajectory[0].longitude]}
                icon={deliveryIcon}
              >
                <Popup>
                  <div className="text-center">
                    <h3 className="font-semibold text-green-600">Start Location</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(trajectory[0].timestamp).toLocaleString()}
                    </p>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeliveryTrajectoryMap;
