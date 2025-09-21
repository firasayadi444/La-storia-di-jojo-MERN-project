import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Clock, 
  Truck, 
  User, 
  Phone, 
  MessageSquare,
  Navigation,
  CheckCircle,
  AlertCircle,
  Timer,
  RefreshCw
} from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import DeliveryTrajectoryMap from './DeliveryTrajectoryMap';

interface DeliveryTrackingProps {
  order: {
    _id: string;
    status: string;
    deliveryMan?: {
      _id: string;
      name: string;
      phone: string;
      email: string;
    };
    estimatedDeliveryTime?: string;
    actualDeliveryTime?: string;
    deliveryNotes?: string;
    deliveryAddress: string;
    customerLocation?: {
      latitude: number;
      longitude: number;
      accuracy?: number;
      timestamp?: string;
    };
    createdAt: string;
    payment?: {
      paymentMethod: string;
      paymentStatus: string;
    };
  };
  onClose?: () => void;
}

// Simple geocoding function for demonstration
const getDeliveryAddressCoords = (address: string) => {
  // This is a simple mapping for demonstration
  // In a real app, you'd use a proper geocoding service like Google Maps API
  const addressLower = address.toLowerCase();
  
  if (addressLower.includes('new york') || addressLower.includes('nyc')) {
    return { lat: 40.7128, lng: -74.0060 };
  } else if (addressLower.includes('london')) {
    return { lat: 51.5074, lng: -0.1278 };
  } else if (addressLower.includes('paris')) {
    return { lat: 48.8566, lng: 2.3522 };
  } else if (addressLower.includes('tokyo')) {
    return { lat: 35.6762, lng: 139.6503 };
  } else {
    // Default to New York coordinates
    return { lat: 40.7128, lng: -74.0060 };
  }
};

const DeliveryTracking: React.FC<DeliveryTrackingProps> = ({ order, onClose }) => {
  const [deliveryStatus, setDeliveryStatus] = useState(order.status);
  const [deliveryMan, setDeliveryMan] = useState(order.deliveryMan);
  const [estimatedTime, setEstimatedTime] = useState(order.estimatedDeliveryTime);
  const [actualTime, setActualTime] = useState(order.actualDeliveryTime);
  const [deliveryNotes, setDeliveryNotes] = useState(order.deliveryNotes);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { socket, registerRefreshCallback, unregisterRefreshCallback } = useSocket();

  // Register for real-time updates
  useEffect(() => {
    const refreshKey = `delivery-tracking-${order._id}`;
    
    const refreshCallback = () => {
      setIsRefreshing(true);
      // Simulate refresh - in real app, you'd fetch updated order data
      setTimeout(() => setIsRefreshing(false), 1000);
    };

    registerRefreshCallback(refreshKey, refreshCallback);

    return () => {
      unregisterRefreshCallback(refreshKey);
    };
  }, [order._id, registerRefreshCallback, unregisterRefreshCallback]);

  // Listen for delivery updates
  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleDeliveryUpdate = (data: any) => {
      if (data.orderId === order._id || data.order?._id === order._id) {
        if (data.order) {
          // Handle order-updated event (from backend orderController)
          setDeliveryStatus(data.order.status);
          setDeliveryMan(data.order.deliveryMan);
          setEstimatedTime(data.order.estimatedDeliveryTime);
          setActualTime(data.order.actualDeliveryTime);
          setDeliveryNotes(data.order.deliveryNotes);
        } else {
          // Handle delivery-update event (from socket service)
          if (data.status) setDeliveryStatus(data.status);
          if (data.deliveryNotes) setDeliveryNotes(data.deliveryNotes);
          if (data.estimatedDeliveryTime) setEstimatedTime(data.estimatedDeliveryTime);
          if (data.actualDeliveryTime) setActualTime(data.actualDeliveryTime);
        }
      }
    };

    socket.on('delivery-update', handleDeliveryUpdate);
    socket.on('order-updated', handleDeliveryUpdate);

    return () => {
      socket.off('delivery-update', handleDeliveryUpdate);
      socket.off('order-updated', handleDeliveryUpdate);
    };
  }, [socket, order._id]);

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
          icon: <CheckCircle className="h-5 w-5" />,
          color: 'bg-blue-100 text-blue-800',
          text: 'Order Confirmed',
          description: 'Your order has been confirmed and is being prepared'
        };
      case 'preparing':
        return {
          icon: <Timer className="h-5 w-5" />,
          color: 'bg-orange-100 text-orange-800',
          text: 'Preparing',
          description: 'Your order is being prepared in the kitchen'
        };
      case 'ready':
        return {
          icon: <AlertCircle className="h-5 w-5" />,
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
          icon: <CheckCircle className="h-5 w-5" />,
          color: 'bg-green-100 text-green-800',
          text: 'Delivered',
          description: 'Your order has been delivered successfully'
        };
      case 'cancelled':
        return {
          icon: <AlertCircle className="h-5 w-5" />,
          color: 'bg-red-100 text-red-800',
          text: 'Cancelled',
          description: 'Your order has been cancelled'
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

  const statusInfo = getStatusInfo(deliveryStatus);

  const formatTime = (timeString?: string) => {
    if (!timeString) return 'Not set';
    return new Date(timeString).toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      day: 'numeric',
      month: 'short'
    });
  };

  const getEstimatedDeliveryTime = () => {
    if (actualTime) return formatTime(actualTime);
    if (estimatedTime) return formatTime(estimatedTime);
    return 'Not estimated yet';
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-6 w-6" />
            Delivery Tracking
          </CardTitle>
          {isRefreshing && (
            <RefreshCw className="h-4 w-4 animate-spin" />
          )}
        </div>
        <p className="text-blue-100">Order #{order._id.slice(-6)}</p>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Current Status */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Badge className={`${statusInfo.color} text-sm font-semibold px-3 py-1`}>
              {statusInfo.icon}
              <span className="ml-2">{statusInfo.text}</span>
            </Badge>
            {/* Payment Status */}
            {order.payment && (
              <Badge 
                variant="outline" 
                className={`${
                  (typeof order.payment === 'object' && order.payment?.paymentStatus === 'paid')
                    ? 'text-green-600 border-green-600' 
                    : (typeof order.payment === 'object' && order.payment?.paymentStatus === 'failed')
                    ? 'text-red-600 border-red-600'
                    : 'text-yellow-600 border-yellow-600'
                }`}
              >
                {typeof order.payment === 'object' && order.payment?.paymentMethod === 'cash' ? '💵 Cash' : '💳 Card'} - {typeof order.payment === 'object' ? order.payment?.paymentStatus?.toUpperCase() || 'PENDING' : 'PENDING'}
              </Badge>
            )}
          </div>
          <p className="text-gray-600 text-sm">{statusInfo.description}</p>
        </div>

        {/* Delivery Timeline */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Navigation className="h-4 w-4" />
            Delivery Timeline
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${deliveryStatus === 'pending' ? 'bg-blue-500' : 'bg-green-500'}`} />
              <span className="text-sm">Order Placed</span>
              <span className="text-xs text-gray-500 ml-auto">
                {formatTime(order.createdAt)}
              </span>
            </div>
            
            {deliveryStatus !== 'pending' && (
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${deliveryStatus === 'confirmed' ? 'bg-blue-500' : 'bg-green-500'}`} />
                <span className="text-sm">Order Confirmed</span>
              </div>
            )}
            
            {['preparing', 'ready', 'out_for_delivery', 'delivered'].includes(deliveryStatus) && (
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${deliveryStatus === 'preparing' ? 'bg-blue-500' : 'bg-green-500'}`} />
                <span className="text-sm">Preparing</span>
              </div>
            )}
            
            {['ready', 'out_for_delivery', 'delivered'].includes(deliveryStatus) && (
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${deliveryStatus === 'ready' ? 'bg-blue-500' : 'bg-green-500'}`} />
                <span className="text-sm">Ready for Pickup</span>
              </div>
            )}
            
            {['out_for_delivery', 'delivered'].includes(deliveryStatus) && (
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${deliveryStatus === 'out_for_delivery' ? 'bg-blue-500' : 'bg-green-500'}`} />
                <span className="text-sm">Out for Delivery</span>
              </div>
            )}
            
            {deliveryStatus === 'delivered' && (
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm">Delivered</span>
                <span className="text-xs text-gray-500 ml-auto">
                  {formatTime(actualTime)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Delivery Information */}
        {deliveryMan && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Your Delivery Person
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">{deliveryMan.name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-3 w-3" />
                <a href={`tel:${deliveryMan.phone}`} className="hover:text-blue-600">
                  {deliveryMan.phone}
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MessageSquare className="h-3 w-3" />
                <a href={`mailto:${deliveryMan.email}`} className="hover:text-blue-600">
                  {deliveryMan.email}
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Delivery Details */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Delivery Details
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Delivery Address:</span>
              <span className="font-medium">{order.deliveryAddress}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Estimated Delivery:</span>
              <span className="font-medium">{getEstimatedDeliveryTime()}</span>
            </div>
            {deliveryNotes && (
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Notes:</span>
                <span className="font-medium">{deliveryNotes}</span>
              </div>
            )}
          </div>
        </div>

        {/* Delivery Trajectory Map */}
        {deliveryMan && ['out_for_delivery', 'delivered'].includes(deliveryStatus) && (
          <div className="mb-6">
            <DeliveryTrajectoryMap
              orderId={order._id}
              deliveryManId={deliveryMan._id}
              deliveryAddress={order.deliveryAddress}
              deliveryAddressCoords={getDeliveryAddressCoords(order.deliveryAddress)}
              customerLocation={order.customerLocation}
              onLocationUpdate={(location) => {
                // Handle real-time location updates
                console.log('Location update:', location);
              }}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {deliveryMan && deliveryStatus === 'out_for_delivery' && (
            <Button 
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={() => window.open(`tel:${deliveryMan.phone}`)}
            >
              <Phone className="h-4 w-4 mr-2" />
              Call Delivery Person
            </Button>
          )}
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close Tracking
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DeliveryTracking;
