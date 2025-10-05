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
  RefreshCw,
  ExternalLink,
  Play,
  Pause,
  Map,
  Package,
  Utensils
} from 'lucide-react';
import { calculateDistance, formatDistance, calculateETA, formatTime } from '@/utils/distanceCalculator';
import { io, Socket } from 'socket.io-client';
import { Order } from '@/services/api';
import GoogleMapsNavigation from './GoogleMapsNavigation';
import { locationService, LocationData } from '@/services/locationService';
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
  const [trackingPaused, setTrackingPaused] = useState(false);
  const [showGoogleMaps, setShowGoogleMaps] = useState(false);
  const watchId = useRef<number | null>(null);

  // Restaurant location (fixed)
  const restaurantLocation: [number, number] = [36.90272039645084, 10.187488663609964];
  const customerLocation: [number, number] | null = order.customerLocation 
    ? [order.customerLocation.latitude, order.customerLocation.longitude]
    : null;

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
          
          // Then start continuous tracking
          await locationService.startTracking((location: LocationData) => {
            setCurrentLocation(location);
            setLastUpdate(new Date());
            
            // Emit socket event for real-time updates
            if (socket && isConnected) {
              console.log('📤 Emitting auto-tracking location update for order:', order._id, location);
              socket.emit('location-update', {
                orderId: order._id,
                location: location,
                timestamp: new Date().toISOString()
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

  // Pause/Resume location tracking
  const toggleTracking = () => {
    if (trackingPaused) {
      // Resume tracking
      setTrackingPaused(false);
      if (!isTracking) {
        startLocationTracking();
      }
    } else {
      // Pause tracking
      setTrackingPaused(true);
      locationService.stopTracking();
    }
  };

  // Get customer address for Google Maps
  const getCustomerAddress = () => {
    return order.deliveryAddress || 'Customer Location';
  };

  // Get restaurant address for Google Maps
  const getRestaurantAddress = () => {
    return 'Restaurant Location'; // You can make this dynamic based on your restaurant data
  };

  // Cleanup on unmount and when dialog closes
  useEffect(() => {
    return () => {
      if (isTracking) {
        locationService.stopTracking();
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
    const positions: [number, number][] = [restaurantLocation];
    if (currentLocation) {
      positions.push([currentLocation.latitude, currentLocation.longitude]);
    }
    if (customerLocation) {
      positions.push(customerLocation);
    }
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
      <DialogContent className="max-w-6xl w-full h-[95vh] sm:h-[90vh] p-0">
        <DialogHeader className="p-3 sm:p-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Truck className="h-5 w-5 sm:h-6 sm:w-6 text-italian-green-600" />
              <span className="hidden sm:inline">Delivery Tracking - Order #{order._id.slice(-8)}</span>
              <span className="sm:hidden">Order #{order._id.slice(-8)}</span>
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Badge className={`${getStatusColor(order.status)} text-xs`}>
                {order.status.replace('_', ' ').toUpperCase()}
              </Badge>
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

          <div className="flex-1 flex flex-col lg:flex-row">
            {/* Map */}
            <div className="flex-1 relative min-h-[300px] lg:min-h-0">
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
                  
                  {/* Current Location Marker */}
                  {currentLocation && (
                    <Marker position={[currentLocation.latitude, currentLocation.longitude]} icon={deliveryIcon}>
                      <div className="text-center">
                        <div className="font-semibold">🚴 Your Location</div>
                        <div className="text-sm text-gray-600">Current Position</div>
                      </div>
                    </Marker>
                  )}
                  
                  {/* Route Polyline */}
                  {routePositions.length > 1 && (
                    <Polyline
                      positions={routePositions}
                      color="#3b82f6"
                      weight={4}
                      opacity={0.8}
                    />
                  )}
                </MapContainer>
              )}

              {isLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                  <div className="flex items-center gap-2 bg-white p-4 rounded-lg shadow-lg">
                    <Loader2 className="h-5 w-5 animate-spin text-italian-green-600" />
                    <span className="text-gray-700">Getting location...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Info Panel */}
            <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l bg-gray-50 overflow-y-auto max-h-[400px] lg:max-h-none">
              <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
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
                      {order.estimatedDeliveryTime && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Est. Delivery:</span>
                          <span className="font-medium">{formatEstimatedTime(order.estimatedDeliveryTime)}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

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

                {/* Location Tracking Controls */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Navigation className="h-4 w-4" />
                      Location Tracking
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Status:</span>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${isTracking && !trackingPaused ? 'bg-green-500' : 'bg-gray-400'}`} />
                          <span className="text-xs">
                            {isTracking && !trackingPaused ? 'Active' : trackingPaused ? 'Paused' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {!isTracking ? (
                          <Button
                            size="sm"
                            onClick={startLocationTracking}
                            disabled={isLoading}
                            className="flex-1"
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Start Tracking
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant={trackingPaused ? "default" : "outline"}
                            onClick={toggleTracking}
                            className="flex-1"
                          >
                            {trackingPaused ? (
                              <>
                                <Play className="h-3 w-3 mr-1" />
                                Resume
                              </>
                            ) : (
                              <>
                                <Pause className="h-3 w-3 mr-1" />
                                Pause
                              </>
                            )}
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={getCurrentLocation}
                          disabled={isLoading}
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      {isTracking && (
                        <div className="text-xs text-gray-500">
                          Location updates every 30 seconds
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Google Maps Navigation */}
                {currentLocation && customerLocation && (
                  <Card className="border-blue-200 bg-blue-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-blue-800">
                        <Map className="h-4 w-4" />
                        Navigation to Customer
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {/* Customer Address Display */}
                        <div className="bg-white rounded-lg p-3 border">
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">Delivery Address:</p>
                              <p className="text-sm text-gray-700 break-words">{getCustomerAddress()}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Navigation Component */}
                        <GoogleMapsNavigation
                          fromLocation={currentLocation}
                          toLocation={customerLocation}
                          fromAddress="Your Current Location"
                          toAddress={getCustomerAddress()}
                          className="text-xs"
                        />
                        
                        {/* Quick Actions */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                            onClick={() => {
                              const url = `https://www.google.com/maps/dir/?api=1&destination=${customerLocation[0]},${customerLocation[1]}`;
                              window.open(url, '_blank');
                            }}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Quick Open
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const url = `tel:${order.user?.phone || ''}`;
                              if (order.user?.phone) {
                                window.open(url);
                              }
                            }}
                            disabled={!order.user?.phone}
                          >
                            <Phone className="h-3 w-3 mr-1" />
                            Call
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Delivery Progress */}
                {canTrackDelivery && currentLocation && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Target className="h-4 w-4" />
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

                {/* Customer Information */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Customer Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="font-medium text-sm">{order.user?.name || 'Unknown Customer'}</p>
                          <p className="text-xs text-gray-600">Customer Name</p>
                        </div>
                      </div>
                      
                      {order.user?.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{order.user.phone}</p>
                            <p className="text-xs text-gray-600">Phone Number</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`tel:${order.user.phone}`)}
                            className="text-xs"
                          >
                            <Phone className="h-3 w-3 mr-1" />
                            Call
                          </Button>
                        </div>
                      )}
                      
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium break-words">{getCustomerAddress()}</p>
                          <p className="text-xs text-gray-600">Delivery Address</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Order Items Details */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Order Items ({order.items?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item, index) => (
                          <div key={item._id || index} className="border rounded-lg p-3 bg-gray-50">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm">{item.food?.name || 'Unknown Item'}</h4>
                                <p className="text-xs text-gray-600 mb-1">{item.food?.category || 'No category'}</p>
                                {item.food?.description && (
                                  <p className="text-xs text-gray-500 mb-2">{item.food.description}</p>
                                )}
                                <div className="flex items-center gap-4 text-xs">
                                  <span className="flex items-center gap-1">
                                    <Utensils className="h-3 w-3" />
                                    Qty: {item.quantity}
                                  </span>
                                  <span className="font-medium">
                                    €{item.price?.toFixed(2) || '0.00'}
                                  </span>
                                </div>
                              </div>
                              {item.food?.image && (
                                <img
                                  src={item.food.image}
                                  alt={item.food.name}
                                  className="w-12 h-12 object-cover rounded-lg ml-3"
                                  onError={(e) => {
                                    e.currentTarget.src = `https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=48&h=48&fit=crop`;
                                  }}
                                />
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm">No items found</p>
                        </div>
                      )}
                      
                      {/* Order Total */}
                      {order.items && order.items.length > 0 && (
                        <div className="border-t pt-3 mt-3">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-sm">Order Total:</span>
                            <span className="font-bold text-lg text-green-600">
                              €{order.totalAmount?.toFixed(2) || '0.00'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

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
