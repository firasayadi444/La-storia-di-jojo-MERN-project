import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  X, 
  Clock, 
  Navigation, 
  User, 
  Phone, 
  Bike,
  Loader2,
  AlertCircle,
  CheckCircle,
  Truck,
  Target,
  Route,
  RefreshCw
} from 'lucide-react';
import { calculateDistance, formatDistance, calculateETA, formatTime } from '@/utils/distanceCalculator';
import { io, Socket } from 'socket.io-client';
import { Order } from '@/services/api';
import { locationService, LocationData } from '@/services/locationService';
import { getSmartRoute, getFallbackRoute, interpolateRoute, RouteResult } from '@/services/openRouteService';
import { getOptimizedRoute, RoutePoint } from '@/services/optimizedRouteService';
import { stabilizeLocation, StabilizedLocation } from '@/services/locationStabilizer';
import { testRouteAPI } from '@/utils/routeTester';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons
const restaurantIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const customerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const deliveryIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Use the Order type from api.ts

interface DeliveryTrackingProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  deliveryManLocation?: {
    latitude: number;
    longitude: number;
  } | null;
}

interface MapBoundsProps {
  positions: [number, number][];
}

const MapBounds: React.FC<MapBoundsProps> = ({ positions }) => {
  const map = useMap();
  
  useEffect(() => {
    if (positions.length > 0 && map && map.getContainer()) {
      // Add a small delay to ensure map is fully initialized
      const timer = setTimeout(() => {
        try {
          if (map && map.getContainer()) {
            const bounds = L.latLngBounds(positions);
            map.fitBounds(bounds, { padding: [20, 20] });
          }
        } catch (error) {
          console.error('Error fitting map bounds:', error);
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [map, positions]);

  return null;
};

const DeliveryTracking: React.FC<DeliveryTrackingProps> = ({ isOpen, onClose, order, deliveryManLocation }) => {
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [distance, setDistance] = useState<number>(0);
  const [eta, setEta] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isTracking, setIsTracking] = useState(false);
  const [mapError, setMapError] = useState<string>('');
  const [routeData, setRouteData] = useState<RouteResult | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [animatedPosition, setAnimatedPosition] = useState<[number, number] | null>(null);
  const [stabilizedLocation, setStabilizedLocation] = useState<StabilizedLocation | null>(null);
  const animationRef = useRef<number | null>(null);
  const watchId = useRef<number | null>(null);

  // Restaurant location (fixed)
  const restaurantLocation: [number, number] = [36.90272039645084, 10.187488663609964];
  const customerLocation: [number, number] | null = order.customerLocation 
    ? [order.customerLocation.latitude, order.customerLocation.longitude]
    : null;

  // Stabilize raw GPS location
  const stabilizeRawLocation = async (rawLocation: LocationData) => {
    try {
      console.log('📍 Stabilizing raw GPS location:', rawLocation);
      const stabilized = await stabilizeLocation(rawLocation, {
        snapToRoad: true,
        movingAverageWindow: 5,
        noiseThresholdMeters: 10,
        maxSnapDistanceMeters: 100
      });
      
      setStabilizedLocation(stabilized);
      console.log('✅ Location stabilized:', {
        original: { lat: rawLocation.latitude, lng: rawLocation.longitude },
        stabilized: { lat: stabilized.latitude, lng: stabilized.longitude },
        isSnappedToRoad: stabilized.isSnappedToRoad
      });
      
      return stabilized;
    } catch (error) {
      console.error('❌ Location stabilization failed:', error);
      // Fallback to raw location
      const fallbackStabilized: StabilizedLocation = {
        latitude: rawLocation.latitude,
        longitude: rawLocation.longitude,
        accuracy: rawLocation.accuracy || 0,
        timestamp: Date.now(),
        isSnappedToRoad: false,
        originalLocation: rawLocation
      };
      setStabilizedLocation(fallbackStabilized);
      return fallbackStabilized;
    }
  };

  // Test OpenRouteService API
  const testRouteAPI = async () => {
    console.log('🧪 Testing OpenRouteService API...');
    await testRouteAPI();
  };

  // Fetch route using optimized OpenRouteService with debouncing and caching
  const fetchRoute = async (start: RoutePoint, end: RoutePoint) => {
    if (!customerLocation) return;
    
    setIsLoadingRoute(true);
    try {
      console.log('🗺️ Fetching optimized route from OpenRouteService...', {
        start: { lat: start.lat, lng: start.lng },
        end: { lat: end.lat, lng: end.lng }
      });
      
      const route = await getOptimizedRoute(start, end, 'delivery', {
        debounceMs: 1500, // 1.5 second debounce for delivery person
        distanceThresholdMeters: 30, // 30 meters threshold for delivery
        maxRetries: 3,
        cacheTimeoutMs: 300000 // 5 minutes cache
      });
      
      if (route && route.coordinates && route.coordinates.length > 0) {
        setRouteData(route);
        console.log('✅ Optimized route fetched successfully:', {
          distance: `${(route.distance / 1000).toFixed(2)} km`,
          duration: `${Math.round(route.duration / 60)} minutes`,
          waypoints: route.coordinates.length,
          firstPoint: route.coordinates[0],
          lastPoint: route.coordinates[route.coordinates.length - 1]
        });
        
        // Start marker animation if we have a current location
        if (currentLocation) {
          startMarkerAnimation(route, currentLocation);
        }
      } else {
        console.warn('⚠️ Route fetch returned null or empty coordinates, using fallback');
        const fallbackRoute = getFallbackRoute(start, end);
        setRouteData(fallbackRoute);
      }
    } catch (error) {
      console.error('❌ Error fetching optimized route:', error);
      const fallbackRoute = getFallbackRoute(start, end);
      setRouteData(fallbackRoute);
    } finally {
      setIsLoadingRoute(false);
    }
  };

  // Start marker animation along the route
  const startMarkerAnimation = (route: RouteResult, startLocation: { latitude: number; longitude: number }) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // Find the closest point on the route to the current location
    const interpolatedRoute = interpolateRoute(route.coordinates, 100);
    let closestIndex = 0;
    let minDistance = Infinity;

    interpolatedRoute.forEach((point, index) => {
      const distance = calculateDistance(startLocation.latitude, startLocation.longitude, point[0], point[1]);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    // Animate from the closest point to the end
    let currentIndex = closestIndex;
    const animate = () => {
      if (currentIndex < interpolatedRoute.length) {
        setAnimatedPosition(interpolatedRoute[currentIndex]);
        currentIndex++;
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animate();
  };

  // Update route when stabilized location changes (DELIVERY PERSON PERSPECTIVE)
  useEffect(() => {
    if (stabilizedLocation && customerLocation && isOpen) {
      console.log('🚚 DeliveryTracking: Fetching route from stabilized delivery person location to customer');
      fetchRoute(
        { lat: stabilizedLocation.latitude, lng: stabilizedLocation.longitude }, // FROM: Stabilized delivery person location
        { lat: customerLocation[0], lng: customerLocation[1] }                   // TO: Customer location
      );
    }
  }, [stabilizedLocation, customerLocation, isOpen]);

  // Force initial route fetch when dialog opens
  useEffect(() => {
    if (isOpen && customerLocation) {
      console.log('🚀 Force fetching initial route when dialog opens');
      // Use restaurant location as fallback if no stabilized location yet
      const startPoint = stabilizedLocation || { latitude: restaurantLocation[0], longitude: restaurantLocation[1] };
      fetchRoute(
        { lat: startPoint.latitude, lng: startPoint.longitude },
        { lat: customerLocation[0], lng: customerLocation[1] }
      );
    }
  }, [isOpen, customerLocation]);

  // Initialize current location and start automatic tracking
  useEffect(() => {
    if (deliveryManLocation) {
      setCurrentLocation(deliveryManLocation);
    }
    
    // Automatically start location tracking when dialog opens
    if (isOpen && !isTracking) {
      const startAutoTracking = async () => {
        try {
          // First get current location
          const location = await locationService.getCurrentLocation();
          setCurrentLocation(location);
          setError('');
          
          // Emit initial location update with a small delay to ensure room joining
          setTimeout(() => {
            if (socket && isConnected) {
              console.log('📤 Emitting initial location update for order:', order._id, location);
              socket.emit('location-update', {
                orderId: order._id,
                location: location,
                timestamp: new Date().toISOString()
              });
            } else {
              console.log('❌ Socket not connected for initial location update');
            }
          }, 1000); // 1 second delay
          
          // Then start continuous tracking with stabilization
          await locationService.startTracking(async (location: LocationData) => {
            // Stabilize the raw GPS location
            const stabilized = await stabilizeRawLocation(location);
            
            // Use stabilized location for display and updates
            setCurrentLocation({
              latitude: stabilized.latitude,
              longitude: stabilized.longitude
            });
            setLastUpdate(new Date());
            
            // Emit socket event for real-time updates (use stabilized location)
            if (socket && isConnected) {
              console.log('📤 Emitting stabilized location update for order:', order._id, stabilized);
              socket.emit('location-update', {
                orderId: order._id,
                location: {
                  latitude: stabilized.latitude,
                  longitude: stabilized.longitude,
                  accuracy: stabilized.accuracy
                },
                timestamp: new Date().toISOString(),
                isStabilized: true,
                isSnappedToRoad: stabilized.isSnappedToRoad
              });
            } else {
              console.log('❌ Socket not connected for auto-tracking location update');
            }
          });
          setIsTracking(true);
        } catch (error) {
          console.error('Error starting automatic tracking:', error);
          setError(error instanceof Error ? error.message : 'Failed to start automatic tracking');
        }
      };
      
      startAutoTracking();
    }
  }, [isOpen, deliveryManLocation, isTracking]);

  // Socket.io connection
  useEffect(() => {
    if (!isOpen) return;

    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      setError('');
      
      // Join delivery room to send location updates
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user._id) {
        newSocket.emit('join-room', { userId: user._id, role: 'delivery' });
        console.log('🔗 Delivery man joined delivery room:', user._id);
      }
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [isOpen]);

  // Get current location
  const getCurrentLocation = async () => {
    try {
      setIsLoading(true);
      const location = await locationService.getCurrentLocation();
      setCurrentLocation(location);
      setError('');
      await locationService.updateLocation(location, order._id);
      
      // Emit socket event for real-time updates
      if (socket && isConnected) {
        console.log('📤 Emitting location update for order:', order._id, location);
        socket.emit('location-update', {
          orderId: order._id,
          location: location,
          timestamp: new Date().toISOString()
        });
      } else {
        console.log('❌ Socket not connected, cannot emit location update');
      }
    } catch (error) {
      console.error('Error getting location:', error);
      setError(error instanceof Error ? error.message : 'Unable to get your current location');
    } finally {
      setIsLoading(false);
    }
  };

  // Start location tracking
  const startLocationTracking = async () => {
    try {
      setIsLoading(true);
      await locationService.startTracking(async (location: LocationData) => {
        setCurrentLocation(location);
        setLastUpdate(new Date());
        
        // Emit socket event for real-time updates
        if (socket && isConnected) {
          console.log('📤 Emitting continuous location update for order:', order._id, location);
          socket.emit('location-update', {
            orderId: order._id,
            location: location,
            timestamp: new Date().toISOString()
          });
        } else {
          console.log('❌ Socket not connected, cannot emit continuous location update');
        }
      });
      setIsTracking(true);
      setError('');
    } catch (error) {
      console.error('Error starting location tracking:', error);
      setError(error instanceof Error ? error.message : 'Error starting location tracking');
    } finally {
      setIsLoading(false);
    }
  };

  // Stop location tracking
  const stopLocationTracking = () => {
    locationService.stopTracking();
    setIsTracking(false);
  };

  // Cleanup on unmount and when dialog closes
  useEffect(() => {
    return () => {
      if (isTracking) {
        locationService.stopTracking();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isTracking]);

  // Stop tracking when dialog closes
  useEffect(() => {
    if (!isOpen && isTracking) {
      locationService.stopTracking();
      setIsTracking(false);
    }
  }, [isOpen, isTracking]);

  // Calculate distance and ETA
  const updateCalculations = (deliveryPos: { latitude: number; longitude: number }) => {
    if (!order.customerLocation) return;
    
    const dist = calculateDistance(
      deliveryPos.latitude,
      deliveryPos.longitude,
      order.customerLocation.latitude,
      order.customerLocation.longitude
    );
    setDistance(dist);
    setEta(calculateETA(dist));
  };

  // Update calculations when current location changes
  useEffect(() => {
    if (currentLocation) {
      updateCalculations(currentLocation);
    }
  }, [currentLocation, order.customerLocation]);

  // Get all positions for map bounds
  const getAllPositions = (): [number, number][] => {
    const positions: [number, number][] = [restaurantLocation];
    if (customerLocation) {
      positions.push(customerLocation);
    }
    if (currentLocation) {
      positions.push([currentLocation.latitude, currentLocation.longitude]);
    }
    return positions;
  };

  // Get route polyline positions
  const getRoutePositions = (): [number, number][] => {
    console.log('🔍 getRoutePositions called:', {
      hasRouteData: !!routeData,
      routeDataLength: routeData?.coordinates?.length || 0,
      currentLocation,
      customerLocation
    });
    
    // Use real route data if available, otherwise fallback to straight line
    if (routeData && routeData.coordinates && routeData.coordinates.length > 0) {
      console.log('✅ Using real route data with', routeData.coordinates.length, 'coordinates');
      return routeData.coordinates;
    }
    
    // Fallback to straight line routing
    console.log('⚠️ Using fallback straight line routing');
    const positions: [number, number][] = [restaurantLocation];
    if (currentLocation) {
      positions.push([currentLocation.latitude, currentLocation.longitude]);
    }
    if (customerLocation) {
      positions.push(customerLocation);
    }
    console.log('📍 Fallback positions:', positions);
    return positions;
  };

  // Get status badge color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'ready':
        return 'bg-purple-100 text-purple-800';
      case 'out_for_delivery':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format estimated delivery time
  const formatEstimatedTime = (timeString: string): string => {
    const time = new Date(timeString);
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const canTrackDelivery = order.status === 'out_for_delivery';
  const allPositions = getAllPositions();
  const routePositions = getRoutePositions();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full h-[90vh] p-0">
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-6 w-6 text-italian-green-600" />
              Delivery Person View - Order #{order._id.slice(-8)}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(order.status)}>
                {order.status.replace('_', ' ').toUpperCase()}
              </Badge>
              <Button variant="outline" size="sm" onClick={testRouteAPI} className="text-xs">
                Test Route API
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  if (stabilizedLocation && customerLocation) {
                    fetchRoute(
                      { lat: stabilizedLocation.latitude, lng: stabilizedLocation.longitude },
                      { lat: customerLocation[0], lng: customerLocation[1] }
                    );
                  }
                }}
                className="text-xs"
                disabled={!stabilizedLocation || !customerLocation}
              >
                Refresh Route
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Connection Status */}
          <div className="px-4 py-2 bg-gray-50 border-b">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className={isConnected ? 'text-green-700' : 'text-red-700'}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              {lastUpdate && (
                <span className="text-gray-600">
                  Last update: {lastUpdate.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 flex">
            {/* Map */}
            <div className="flex-1 relative">
              {mapError ? (
                <div className="h-full w-full flex items-center justify-center bg-gray-100">
                  <div className="text-center p-8">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Map Unavailable</h3>
                    <p className="text-gray-600 mb-4">{mapError}</p>
                    <Button 
                      onClick={() => {
                        setMapError('');
                        window.location.reload();
                      }}
                      variant="outline"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Page
                    </Button>
                  </div>
                </div>
              ) : (
                <MapContainer
                  center={restaurantLocation}
                  zoom={13}
                  className="h-full w-full"
                  scrollWheelZoom={true}
                  key={`map-${isOpen}`} // Force re-render when dialog opens
                >
                  <MapBounds positions={allPositions} />
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  
                  {/* Restaurant Marker */}
                  <Marker position={restaurantLocation} icon={restaurantIcon}>
                    <div className="text-center">
                      <div className="font-semibold">🏪 Restaurant</div>
                      <div className="text-sm text-gray-600">Pickup Location</div>
                    </div>
                  </Marker>
                  
                  {/* Customer Marker */}
                  {customerLocation && (
                    <Marker position={customerLocation} icon={customerIcon}>
                      <div className="text-center">
                        <div className="font-semibold">📍 Delivery Address</div>
                        <div className="text-sm text-gray-600">{order.deliveryAddress}</div>
                      </div>
                    </Marker>
                  )}
                  
                  {/* Delivery Person Stabilized Location */}
                  {stabilizedLocation && (
                    <Marker position={[stabilizedLocation.latitude, stabilizedLocation.longitude]} icon={deliveryIcon}>
                      <div className="text-center">
                        <div className="font-semibold">🚚 Your Location</div>
                        <div className="text-sm text-gray-600">Delivery Person</div>
                        <div className="text-xs text-gray-500">
                          {stabilizedLocation.isSnappedToRoad ? 'Road Snapped' : 'GPS Stabilized'}
                        </div>
                        {stabilizedLocation.accuracy > 0 && (
                          <div className="text-xs text-blue-600">
                            ±{Math.round(stabilizedLocation.accuracy)}m
                          </div>
                        )}
                      </div>
                    </Marker>
                  )}
                  
                  {/* Show original GPS location if different from stabilized */}
                  {stabilizedLocation?.originalLocation && 
                   (Math.abs(stabilizedLocation.latitude - stabilizedLocation.originalLocation.latitude) > 0.0001 ||
                    Math.abs(stabilizedLocation.longitude - stabilizedLocation.originalLocation.longitude) > 0.0001) && (
                    <Marker position={[stabilizedLocation.originalLocation.latitude, stabilizedLocation.originalLocation.longitude]} 
                            icon={new L.Icon({
                              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png',
                              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                              iconSize: [20, 32],
                              iconAnchor: [10, 32],
                              popupAnchor: [1, -34],
                              shadowSize: [32, 32]
                            })}>
                      <div className="text-center">
                        <div className="font-semibold">📍 Raw GPS</div>
                        <div className="text-xs text-gray-500">Original</div>
                      </div>
                    </Marker>
                  )}
                  
                  {/* Animated Route Preview */}
                  {animatedPosition && (
                    <Marker position={animatedPosition} icon={deliveryIcon}>
                      <div className="text-center">
                        <div className="font-semibold">📍 Route Preview</div>
                        <div className="text-sm text-gray-600">To Customer</div>
                        <div className="text-xs text-gray-500">Following Roads</div>
                      </div>
                    </Marker>
                  )}
                  
                  {/* Route Polyline (Delivery Person View) */}
                  {routePositions.length > 1 && (
                    <Polyline
                      positions={routePositions}
                      color="#10b981"
                      weight={5}
                      opacity={0.9}
                    />
                  )}
                </MapContainer>
              )}

              {(isLoading || isLoadingRoute) && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                  <div className="flex items-center gap-2 bg-white p-4 rounded-lg shadow-lg">
                    <Loader2 className="h-5 w-5 animate-spin text-italian-green-600" />
                    <span className="text-gray-700">
                      {isLoadingRoute ? 'Calculating route...' : 'Getting location...'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Info Panel */}
            <div className="w-80 border-l bg-gray-50 overflow-y-auto">
              <div className="p-4 space-y-4">
                {/* Order Status */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Order Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Status:</span>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">View:</span>
                      <Badge className="bg-green-100 text-green-800">
                        DELIVERY PERSON
                      </Badge>
                      </div>
                      {order.estimatedDeliveryTime && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Est. Delivery:</span>
                          <span className="font-medium">{formatEstimatedTime(order.estimatedDeliveryTime)}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>


                {/* Location Stabilization Info */}
                {stabilizedLocation && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Location Stabilization
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Status:</span>
                          <Badge className={stabilizedLocation.isSnappedToRoad ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>
                            {stabilizedLocation.isSnappedToRoad ? "Road Snapped" : "GPS Stabilized"}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Accuracy:</span>
                          <span className="font-medium">
                            {stabilizedLocation.accuracy > 0 ? `±${Math.round(stabilizedLocation.accuracy)}m` : 'Unknown'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Last Update:</span>
                          <span className="font-medium">
                            {new Date(stabilizedLocation.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        {stabilizedLocation.originalLocation && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Correction:</span>
                            <span className="font-medium text-green-600">
                              {Math.round(calculateDistance(
                                stabilizedLocation.latitude,
                                stabilizedLocation.longitude,
                                stabilizedLocation.originalLocation.latitude,
                                stabilizedLocation.originalLocation.longitude
                              ))}m
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Customer Information */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Customer Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{order.user?.name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium">{order.user?.phone || 'N/A'}</span>
                      </div>
                      {order.user?.phone && (
                        <Button
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => window.open(`tel:${order.user?.phone}`)}
                        >
                          <Phone className="h-3 w-3 mr-2" />
                          Call Customer
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Delivery Progress */}
                {canTrackDelivery && currentLocation && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Navigation className="h-4 w-4" />
                        Delivery Progress
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Distance:</span>
                          <span className="font-medium">{formatDistance(distance)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">ETA:</span>
                          <span className="font-medium">{formatTime(eta)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Location Controls */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Location Tracking
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {/* Auto-tracking status */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Auto-tracking:</span>
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className={isTracking ? 'text-green-700' : 'text-red-700'}>
                            {isTracking ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>

                      {!currentLocation ? (
                        <div className="text-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Getting your location...</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="text-sm text-gray-600">
                            <strong>Current Location:</strong><br />
                            Lat: {currentLocation.latitude.toFixed(6)}<br />
                            Lng: {currentLocation.longitude.toFixed(6)}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={isTracking ? stopLocationTracking : startLocationTracking}
                              variant={isTracking ? "destructive" : "default"}
                              size="sm"
                              className="flex-1"
                            >
                              {isTracking ? (
                                <>
                                  <X className="h-3 w-3 mr-1" />
                                  Stop
                                </>
                              ) : (
                                <>
                                  <Route className="h-3 w-3 mr-1" />
                                  Start
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={getCurrentLocation}
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              disabled={isLoading}
                            >
                              {isLoading ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <RefreshCw className="h-3 w-3 mr-1" />
                              )}
                              Update
                            </Button>
                          </div>
                          {isTracking && (
                            <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                              ✓ Location updates automatically every 15 seconds
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {error && (
                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 text-red-700">
                        <AlertCircle className="h-5 w-5" />
                        <span className="text-sm">{error}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeliveryTracking;
