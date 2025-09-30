import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  Truck, 
  User, 
  RefreshCw,
  Route,
  Timer
} from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import { apiService } from '../services/api';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons
const createCustomIcon = (color: string, icon: string) => L.divIcon({
  className: 'custom-marker',
  html: `
    <div class="w-8 h-8 bg-${color}-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
      <div class="text-white text-lg">${icon}</div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

const restaurantIcon = createCustomIcon('blue', '🏪');
const customerIcon = createCustomIcon('red', '🏠');
const deliveryIcon = createCustomIcon('green', '🚚');

interface LocationPoint {
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

interface DeliveryTrackingMapProps {
  orderId: string;
  deliveryManId?: string;
  customerLocation: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  deliveryAddress: string;
  restaurantLocation?: {
    latitude: number;
    longitude: number;
  };
  onLocationUpdate?: (location: LocationPoint) => void;
  onRouteUpdate?: (route: any) => void;
}

// Restaurant coordinates (Tunis, Tunisia)
const RESTAURANT_COORDS = {
  latitude: 36.867238,
  longitude: 10.183467
};

// Map updater component for real-time updates
const MapUpdater: React.FC<{
  deliveryLocation?: LocationPoint;
  customerLocation: { latitude: number; longitude: number };
  route?: any;
}> = ({ deliveryLocation, customerLocation, route }) => {
  const map = useMap();

  useEffect(() => {
    if (deliveryLocation) {
      map.setView([deliveryLocation.latitude, deliveryLocation.longitude], 15);
    }
  }, [deliveryLocation, map]);

  return null;
};

const DeliveryTrackingMap: React.FC<DeliveryTrackingMapProps> = ({
  orderId,
  deliveryManId,
  customerLocation,
  deliveryAddress,
  restaurantLocation = RESTAURANT_COORDS,
  onLocationUpdate,
  onRouteUpdate
}) => {
  const [deliveryLocation, setDeliveryLocation] = useState<LocationPoint | null>(null);
  const [trajectory, setTrajectory] = useState<LocationPoint[]>([]);
  const [route, setRoute] = useState<any>(null);
  const [eta, setEta] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { socket } = useSocket();
  const mapRef = useRef<L.Map>(null);

  // Calculate map center
  const mapCenter: [number, number] = deliveryLocation 
    ? [deliveryLocation.latitude, deliveryLocation.longitude]
    : [customerLocation.latitude, customerLocation.longitude];

  // Fetch delivery trajectory
  const fetchTrajectory = useCallback(async () => {
    if (!deliveryManId) return;

    try {
      setIsLoading(true);
      // Use new delivery tracking system instead of old trajectory method
      const response = await apiService.getDeliveryTracking(orderId);
      if (response.success && response.data.trajectory) {
        setTrajectory(response.data.trajectory);
      }
    } catch (error) {
      console.error('Error fetching trajectory:', error);
    } finally {
      setIsLoading(false);
    }
  }, [deliveryManId, orderId]);

  // Calculate route and ETA
  const calculateRoute = useCallback(async () => {
    if (!deliveryLocation || !customerLocation) return;

    try {
      const start = [deliveryLocation.longitude, deliveryLocation.latitude];
      const end = [customerLocation.longitude, customerLocation.latitude];

      // Use OSRM for route calculation (bike profile)
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/bike/${start.join(',')};${end.join(',')}?overview=full&geometries=geojson`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.routes && data.routes.length > 0) {
          const routeData = data.routes[0];
          setRoute(routeData);
          setDistance(Math.round(routeData.distance));
          setEta(Math.round(routeData.duration / 60)); // Convert to minutes
          onRouteUpdate?.(routeData);
        }
      }
    } catch (error) {
      console.error('Error calculating route:', error);
    }
  }, [deliveryLocation, customerLocation, onRouteUpdate]);

  // Listen for real-time location updates
  useEffect(() => {
    if (!socket) return;

    const handleLocationUpdate = (data: any) => {
      if (data.orderId === orderId) {
        console.log('📍 Received real-time location update:', data);
        const newLocation: LocationPoint = {
          latitude: data.location.lat,
          longitude: data.location.lng,
          timestamp: data.timestamp,
          accuracy: data.accuracy || data.location.accuracy || 10,
          speed: data.speed || data.location.speed || 0,
          heading: data.heading || data.location.heading || 0
        };

        // Filter out inaccurate locations (accuracy > 100m)
        if (newLocation.accuracy <= 100) {
          setDeliveryLocation(newLocation);
          setTrajectory(prev => [...prev, newLocation]);
          setLastUpdate(new Date());
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

  // Calculate route when delivery location changes
  useEffect(() => {
    if (deliveryLocation) {
      calculateRoute();
    }
  }, [deliveryLocation, calculateRoute]);

  // Fetch initial trajectory
  useEffect(() => {
    fetchTrajectory();
  }, [fetchTrajectory]);

  // Refresh data
  const handleRefresh = () => {
    fetchTrajectory();
    if (deliveryLocation) {
      calculateRoute();
    }
  };

  // Format time
  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Format distance
  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${meters}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  return (
    <Card className="w-full">
      <CardHeader className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-6 w-6" />
            Live Delivery Tracking
          </CardTitle>
          <div className="flex items-center gap-2">
            {lastUpdate && (
              <Badge variant="secondary" className="bg-white/20 text-white">
                <Clock className="h-3 w-3 mr-1" />
                Updated {lastUpdate.toLocaleTimeString()}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="text-white hover:bg-white/20"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        <p className="text-green-100">Order #{orderId.slice(-6)}</p>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="h-96 relative">
          <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <MapUpdater 
              deliveryLocation={deliveryLocation || undefined}
              customerLocation={customerLocation}
              route={route}
            />
            
            {/* Restaurant Marker */}
            <Marker
              position={[restaurantLocation.latitude, restaurantLocation.longitude]}
              icon={restaurantIcon}
            >
              <Popup>
                <div className="text-center">
                  <h3 className="font-semibold text-blue-600">Restaurant</h3>
                  <p className="text-sm text-gray-600">Pickup Location</p>
                  <p className="text-xs text-gray-500">
                    {restaurantLocation.latitude.toFixed(6)}, {restaurantLocation.longitude.toFixed(6)}
                  </p>
                </div>
              </Popup>
            </Marker>
            
            {/* Customer Marker */}
            <Marker
              position={[customerLocation.latitude, customerLocation.longitude]}
              icon={customerIcon}
            >
              <Popup>
                <div className="text-center">
                  <h3 className="font-semibold text-red-600">Delivery Address</h3>
                  <p className="text-sm text-gray-600">{deliveryAddress}</p>
                  <p className="text-xs text-gray-500">
                    {customerLocation.latitude.toFixed(6)}, {customerLocation.longitude.toFixed(6)}
                  </p>
                  {customerLocation.accuracy && (
                    <p className="text-xs text-gray-500">
                      Accuracy: ±{Math.round(customerLocation.accuracy)}m
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
            
            {/* Delivery Person Marker */}
            {deliveryLocation && (
              <Marker
                position={[deliveryLocation.latitude, deliveryLocation.longitude]}
                icon={deliveryIcon}
              >
                <Popup>
                  <div className="text-center">
                    <h3 className="font-semibold text-green-600">Delivery Person</h3>
                    <p className="text-sm text-gray-600">Current Location</p>
                    <p className="text-xs text-gray-500">
                      {deliveryLocation.latitude.toFixed(6)}, {deliveryLocation.longitude.toFixed(6)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Updated: {new Date(deliveryLocation.timestamp).toLocaleTimeString()}
                    </p>
                    {deliveryLocation.accuracy && (
                      <p className="text-xs text-gray-500">
                        Accuracy: ±{Math.round(deliveryLocation.accuracy)}m
                      </p>
                    )}
                    {deliveryLocation.speed && (
                      <p className="text-xs text-gray-500">
                        Speed: {(deliveryLocation.speed * 3.6).toFixed(1)} km/h
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            )}
            
            {/* Route Polyline */}
            {route && route.geometry && (
              <Polyline
                positions={route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]])}
                color="#3b82f6"
                weight={4}
                opacity={0.8}
              />
            )}
            
            {/* Trajectory Polyline */}
            {trajectory.length > 1 && (
              <Polyline
                positions={trajectory.map(point => [point.latitude, point.longitude])}
                color="#10b981"
                weight={2}
                opacity={0.6}
                dashArray="5, 5"
              />
            )}
          </MapContainer>
          
          {/* Overlay with ETA and Distance */}
          <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 min-w-[200px]">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Route className="h-4 w-4 text-blue-500" />
                <span className="font-semibold text-gray-900">Delivery Status</span>
              </div>
              
              {eta !== null && (
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">
                    <strong>ETA:</strong> {formatTime(eta)}
                  </span>
                </div>
              )}
              
              {distance !== null && (
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-green-500" />
                  <span className="text-sm">
                    <strong>Distance:</strong> {formatDistance(distance)}
                  </span>
                </div>
              )}
              
              {deliveryLocation && (
                <div className="text-xs text-gray-500">
                  Last update: {lastUpdate?.toLocaleTimeString()}
                </div>
              )}
              
              {!deliveryLocation && (
                <div className="text-sm text-gray-500">
                  Waiting for delivery person location...
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeliveryTrackingMap;
