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
  Truck
} from 'lucide-react';
import { calculateDistance, formatDistance, calculateETA, formatTime } from '@/utils/distanceCalculator';
import { io, Socket } from 'socket.io-client';
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

interface Order {
  _id: string;
  status: string;
  estimatedDeliveryTime?: string;
  customerLocation: {
    latitude: number;
    longitude: number;
  };
  deliveryMan?: {
    _id?: string;
    name: string;
    phone: string;
    vehicleType: string;
    currentLocation?: {
      latitude: number;
      longitude: number;
    } | null;
  };
}

interface TrackOrderProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
}

interface MapBoundsProps {
  positions: [number, number][];
}

const MapBounds: React.FC<MapBoundsProps> = ({ positions }) => {
  const map = useMap();
  
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [map, positions]);

  return null;
};

const TrackOrder: React.FC<TrackOrderProps> = ({ isOpen, onClose, order }) => {
  const [deliveryLocation, setDeliveryLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [distance, setDistance] = useState<number>(0);
  const [eta, setEta] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Restaurant location (fixed)
  const restaurantLocation: [number, number] = [36.90272039645084, 10.187488663609964];
  const customerLocation: [number, number] | null = order.customerLocation 
    ? [order.customerLocation.latitude, order.customerLocation.longitude]
    : null;

  // Initialize delivery location from order data
  useEffect(() => {
    console.log('🔍 Order delivery man data:', order.deliveryMan);
    if (order.deliveryMan?.currentLocation && order.deliveryMan.currentLocation.latitude && order.deliveryMan.currentLocation.longitude) {
      console.log('✅ Setting initial delivery location from order data:', order.deliveryMan.currentLocation);
      setDeliveryLocation(order.deliveryMan.currentLocation);
    } else {
      console.log('❌ No delivery location in order data');
    }
  }, [order.deliveryMan]);

  // Socket.io connection
  useEffect(() => {
    if (!isOpen) return;

    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      setError('');
      
      // Join user room to receive location updates
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user._id) {
        newSocket.emit('join-room', { userId: user._id, role: 'user' });
        console.log('🔗 Customer joined user room:', user._id);
      }
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('delivery-location-update', (data: { orderId: string; location: { latitude: number; longitude: number }; timestamp: string }) => {
      console.log('📍 Received delivery location update:', data);
      if (data.orderId === order._id) {
        console.log('✅ Updating delivery location for order:', order._id);
        setDeliveryLocation(data.location);
        setLastUpdate(new Date(data.timestamp));
        updateCalculations(data.location);
      } else {
        console.log('❌ Order ID mismatch:', data.orderId, 'vs', order._id);
      }
    });

    newSocket.on('order-updated', (data: { order: Order }) => {
      if (data.order._id === order._id) {
        // Update order data if needed
        if (data.order.deliveryMan?.currentLocation && data.order.deliveryMan.currentLocation.latitude && data.order.deliveryMan.currentLocation.longitude) {
          setDeliveryLocation(data.order.deliveryMan.currentLocation);
        }
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [isOpen, order._id]);

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

  // Update calculations when delivery location changes
  useEffect(() => {
    if (deliveryLocation) {
      updateCalculations(deliveryLocation);
    }
  }, [deliveryLocation, order.customerLocation]);

  // Get all positions for map bounds
  const getAllPositions = (): [number, number][] => {
    const positions: [number, number][] = [restaurantLocation];
    if (customerLocation) {
      positions.push(customerLocation);
    }
    if (deliveryLocation) {
      positions.push([deliveryLocation.latitude, deliveryLocation.longitude]);
    }
    return positions;
  };

  // Get route polyline positions
  const getRoutePositions = (): [number, number][] => {
    const positions: [number, number][] = [restaurantLocation];
    if (deliveryLocation) {
      positions.push([deliveryLocation.latitude, deliveryLocation.longitude]);
    }
    if (customerLocation) {
      positions.push(customerLocation);
    }
    return positions;
  };

  // Get status badge color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-orange-100 text-orange-800';
      case 'out_for_delivery':
        return 'bg-purple-100 text-purple-800';
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

  const canTrackDelivery = order.status === 'out_for_delivery' && order.deliveryMan;
  const allPositions = getAllPositions();
  const routePositions = getRoutePositions();

  // Debug logging
  console.log('🔍 TrackOrder Debug:', {
    orderId: order._id,
    status: order.status,
    hasDeliveryMan: !!order.deliveryMan,
    deliveryLocation,
    canTrackDelivery,
    allPositions,
    routePositions
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full h-[90vh] p-0">
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-6 w-6 text-italian-green-600" />
              Track Order #{order._id.slice(-8)}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(order.status)}>
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

          <div className="flex-1 flex">
            {/* Map */}
            <div className="flex-1 relative">
              <MapContainer
                center={restaurantLocation}
                zoom={13}
                className="h-full w-full"
                scrollWheelZoom={true}
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
                    <div className="text-sm text-gray-600">Order Origin</div>
                  </div>
                </Marker>
                
                {/* Customer Marker */}
                {customerLocation && (
                  <Marker position={customerLocation} icon={customerIcon}>
                    <div className="text-center">
                      <div className="font-semibold">📍 Delivery Address</div>
                      <div className="text-sm text-gray-600">Your Location</div>
                    </div>
                  </Marker>
                )}
                
                {/* Delivery Person Marker */}
                {canTrackDelivery && (
                  deliveryLocation ? (
                    <Marker position={[deliveryLocation.latitude, deliveryLocation.longitude]} icon={deliveryIcon}>
                      <div className="text-center">
                        <div className="font-semibold">🚴 Delivery Person</div>
                        <div className="text-sm text-gray-600">{order.deliveryMan?.name}</div>
                        <div className="text-xs text-gray-500">Live Location</div>
                      </div>
                    </Marker>
                  ) : order.deliveryMan?.currentLocation ? (
                    <Marker position={[order.deliveryMan.currentLocation.latitude, order.deliveryMan.currentLocation.longitude]} icon={deliveryIcon}>
                      <div className="text-center">
                        <div className="font-semibold">🚴 Delivery Person</div>
                        <div className="text-sm text-gray-600">{order.deliveryMan?.name}</div>
                        <div className="text-xs text-gray-500">Last Known Location</div>
                      </div>
                    </Marker>
                  ) : null
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

              {isLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                  <div className="flex items-center gap-2 bg-white p-4 rounded-lg shadow-lg">
                    <Loader2 className="h-5 w-5 animate-spin text-italian-green-600" />
                    <span className="text-gray-700">Updating location...</span>
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
                        <span className="text-gray-600">Estimated Delivery:</span>
                        <span className="font-medium">{formatEstimatedTime(order.estimatedDeliveryTime)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Delivery Information */}
                {canTrackDelivery && (
                  <>
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
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Delivery Location:</span>
                            <span className="font-medium text-xs">
                              {deliveryLocation ? 'Live' : order.deliveryMan?.currentLocation ? 'Last Known' : 'Not Available'}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Delivery Person
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Name:</span>
                            <span className="font-medium">{order.deliveryMan?.name}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Vehicle:</span>
                            <span className="font-medium flex items-center gap-1">
                              <Bike className="h-3 w-3" />
                              {order.deliveryMan?.vehicleType}
                            </span>
                          </div>
                          {order.deliveryMan?.phone && (
                            <Button
                              size="sm"
                              className="w-full mt-2"
                              onClick={() => window.open(`tel:${order.deliveryMan?.phone}`)}
                            >
                              <Phone className="h-3 w-3 mr-2" />
                              Call Delivery Person
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}

                {/* Status Messages */}
                {!canTrackDelivery && (
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-center text-gray-600">
                        {order.status === 'delivered' ? (
                          <div className="flex items-center justify-center gap-2 text-green-600">
                            <CheckCircle className="h-5 w-5" />
                            <span>Order Delivered!</span>
                          </div>
                        ) : order.status === 'cancelled' ? (
                          <div className="flex items-center justify-center gap-2 text-red-600">
                            <AlertCircle className="h-5 w-5" />
                            <span>Order Cancelled</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2 text-yellow-600">
                            <Clock className="h-5 w-5" />
                            <span>Waiting for delivery assignment</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

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

export default TrackOrder;
