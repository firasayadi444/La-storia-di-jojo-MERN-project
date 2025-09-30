import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Truck, 
  MapPin, 
  Clock, 
  User, 
  Phone, 
  Navigation,
  RefreshCw,
  Timer,
  Route
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '../services/api';
import DeliveryTrackingMap from '../components/DeliveryTrackingMap';
import { useSocket } from '../contexts/SocketContext';

interface DeliveryTrackingData {
  order: {
    _id: string;
    status: string;
    deliveryAddress: string;
    customerLocation: {
      latitude: number;
      longitude: number;
      accuracy?: number;
    };
    estimatedDeliveryTime?: string;
    actualDeliveryTime?: string;
    deliveryNotes?: string;
    assignedAt?: string;
    createdAt: string;
  };
  deliveryMan: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  currentLocation: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: string;
    speed?: number;
    heading?: number;
  } | null;
  route: {
    distance: number;
    duration: number;
    geometry: any;
  } | null;
  trajectory: Array<{
    latitude: number;
    longitude: number;
    timestamp: string;
    accuracy: number;
    speed?: number;
    heading?: number;
  }>;
  deliveryHistory: {
    totalDistance: number;
    totalTime: number;
    averageSpeed: number;
    statusHistory: Array<{
      status: string;
      timestamp: string;
      location: {
        latitude: number;
        longitude: number;
      };
      notes: string;
    }>;
  } | null;
}

const TrackDelivery: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { socket } = useSocket();
  
  const [trackingData, setTrackingData] = useState<DeliveryTrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [eta, setEta] = useState<{
    estimatedDeliveryTime: string;
    remainingMinutes: number;
    distance: number;
  } | null>(null);

  // Fetch tracking data
  const fetchTrackingData = async () => {
    if (!orderId) return;

    try {
      setRefreshing(true);
      const response = await apiService.getDeliveryTrackingData(orderId);
      
      if (response.success) {
        setTrackingData(response.data);
        
        // Calculate ETA if we have current location and route
        if (response.data.currentLocation && response.data.route) {
          const now = new Date();
          const estimatedTime = new Date(response.data.order.estimatedDeliveryTime || now);
          const remainingMinutes = Math.max(0, Math.round((estimatedTime.getTime() - now.getTime()) / (1000 * 60)));
          
          setEta({
            estimatedDeliveryTime: response.data.order.estimatedDeliveryTime || '',
            remainingMinutes,
            distance: Math.round(response.data.route.distance)
          });
        }
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to load tracking data",
          variant: "destructive"
        });
        navigate('/orders');
      }
    } catch (error: any) {
      console.error('Error fetching tracking data:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load tracking data",
        variant: "destructive"
      });
      navigate('/orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchTrackingData();
  }, [orderId]);

  // Listen for real-time updates
  useEffect(() => {
    if (!socket || !orderId) return;

    const handleLocationUpdate = (data: any) => {
      if (data.orderId === orderId) {
        console.log('📍 Real-time location update received:', data);
        // Refresh tracking data to get updated information
        fetchTrackingData();
      }
    };

    const handleDeliveryUpdate = (data: any) => {
      if (data.orderId === orderId || data.order?._id === orderId) {
        console.log('🚚 Delivery update received:', data);
        // Refresh tracking data
        fetchTrackingData();
      }
    };

    socket.on('location-update', handleLocationUpdate);
    socket.on('delivery-update', handleDeliveryUpdate);
    socket.on('order-updated', handleDeliveryUpdate);

    return () => {
      socket.off('location-update', handleLocationUpdate);
      socket.off('delivery-update', handleDeliveryUpdate);
      socket.off('order-updated', handleDeliveryUpdate);
    };
  }, [socket, orderId]);

  // Auto-refresh every 30 seconds when delivery is in progress
  useEffect(() => {
    if (!trackingData || trackingData.order.status !== 'out_for_delivery') return;

    const interval = setInterval(() => {
      fetchTrackingData();
    }, 30000);

    return () => clearInterval(interval);
  }, [trackingData?.order.status]);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          icon: <Clock className="h-5 w-5" />,
          color: 'bg-yellow-100 text-yellow-800',
          text: 'Order Placed',
          description: 'Your order has been placed and is being prepared'
        };
      case 'confirmed':
        return {
          icon: <Clock className="h-5 w-5" />,
          color: 'bg-blue-100 text-blue-800',
          text: 'Order Confirmed',
          description: 'Your order has been confirmed and is being prepared'
        };
      case 'preparing':
        return {
          icon: <Clock className="h-5 w-5" />,
          color: 'bg-orange-100 text-orange-800',
          text: 'Preparing',
          description: 'Your order is being prepared in the kitchen'
        };
      case 'ready':
        return {
          icon: <Clock className="h-5 w-5" />,
          color: 'bg-purple-100 text-purple-800',
          text: 'Ready for Pickup',
          description: 'Your order is ready and waiting for delivery'
        };
      case 'out_for_delivery':
        return {
          icon: <Truck className="h-5 w-5" />,
          color: 'bg-green-100 text-green-800',
          text: 'Out for Delivery',
          description: 'Your order is on its way to you'
        };
      case 'delivered':
        return {
          icon: <Clock className="h-5 w-5" />,
          color: 'bg-green-100 text-green-800',
          text: 'Delivered',
          description: 'Your order has been delivered successfully'
        };
      default:
        return {
          icon: <Clock className="h-5 w-5" />,
          color: 'bg-gray-100 text-gray-800',
          text: 'Unknown',
          description: 'Order status is unknown'
        };
    }
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return 'Not set';
    return new Date(timeString).toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      day: 'numeric',
      month: 'short'
    });
  };

  const formatETA = () => {
    if (!eta) return 'Calculating...';
    
    if (eta.remainingMinutes <= 0) {
      return 'Overdue';
    }
    
    if (eta.remainingMinutes < 60) {
      return `${eta.remainingMinutes}m`;
    }
    
    const hours = Math.floor(eta.remainingMinutes / 60);
    const minutes = eta.remainingMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading delivery tracking...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!trackingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-gray-600 mb-4">Unable to load tracking data</p>
            <Button onClick={() => navigate('/orders')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = getStatusInfo(trackingData.order.status);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              onClick={() => navigate('/orders')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Orders
            </Button>
            
            <Button
              variant="outline"
              onClick={fetchTrackingData}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Track Your Delivery
          </h1>
          <p className="text-gray-600">
            Order #{trackingData.order._id.slice(-6)} • Placed on {formatTime(trackingData.order.createdAt)}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Tracking Card */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-6 w-6" />
                    Delivery Status
                  </CardTitle>
                  <Badge className={`${statusInfo.color} text-sm font-semibold px-3 py-1`}>
                    {statusInfo.icon}
                    <span className="ml-2">{statusInfo.text}</span>
                  </Badge>
                </div>
                <p className="text-gray-600">{statusInfo.description}</p>
              </CardHeader>
              
              <CardContent>
                {/* ETA Information */}
                {eta && trackingData.order.status === 'out_for_delivery' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <Timer className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Estimated Arrival</p>
                      <p className="text-xl font-bold text-blue-800">{formatETA()}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <Route className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Distance</p>
                      <p className="text-xl font-bold text-green-800">
                        {(eta.distance / 1000).toFixed(1)} km
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <Navigation className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Status</p>
                      <p className="text-xl font-bold text-purple-800">Live</p>
                    </div>
                  </div>
                )}

                {/* Delivery Person Info */}
                {trackingData.deliveryMan && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Your Delivery Person
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Name</p>
                        <p className="font-medium">{trackingData.deliveryMan.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <a 
                          href={`tel:${trackingData.deliveryMan.phone}`}
                          className="font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <Phone className="h-3 w-3" />
                          {trackingData.deliveryMan.phone}
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Delivery Details */}
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Delivery Address</p>
                    <p className="font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-red-500" />
                      {trackingData.order.deliveryAddress}
                    </p>
                  </div>
                  
                  {trackingData.order.estimatedDeliveryTime && (
                    <div>
                      <p className="text-sm text-gray-600">Estimated Delivery Time</p>
                      <p className="font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                        {formatTime(trackingData.order.estimatedDeliveryTime)}
                      </p>
                    </div>
                  )}
                  
                  {trackingData.order.actualDeliveryTime && (
                    <div>
                      <p className="text-sm text-gray-600">Actual Delivery Time</p>
                      <p className="font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4 text-green-500" />
                        {formatTime(trackingData.order.actualDeliveryTime)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Delivery Tracking Map */}
            {trackingData.order.status === 'out_for_delivery' && trackingData.deliveryMan && (
              <DeliveryTrackingMap
                orderId={trackingData.order._id}
                deliveryManId={trackingData.deliveryMan._id}
                customerLocation={trackingData.order.customerLocation}
                deliveryAddress={trackingData.order.deliveryAddress}
                onLocationUpdate={(location) => {
                  console.log('Location update:', location);
                }}
                onRouteUpdate={(route) => {
                  console.log('Route update:', route);
                }}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order ID:</span>
                    <span className="font-mono">#{trackingData.order._id.slice(-6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge className={statusInfo.color}>
                      {statusInfo.text}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span>{formatTime(trackingData.order.createdAt)}</span>
                  </div>
                  {trackingData.order.assignedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Assigned:</span>
                      <span>{formatTime(trackingData.order.assignedAt)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Delivery History */}
            {trackingData.deliveryHistory && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Delivery Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Distance:</span>
                      <span>{(trackingData.deliveryHistory.totalDistance / 1000).toFixed(1)} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Time:</span>
                      <span>{trackingData.deliveryHistory.totalTime} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg Speed:</span>
                      <span>{trackingData.deliveryHistory.averageSpeed.toFixed(1)} km/h</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackDelivery;
