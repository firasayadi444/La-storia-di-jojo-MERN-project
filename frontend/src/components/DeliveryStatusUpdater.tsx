import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Clock, 
  Truck, 
  CheckCircle, 
  AlertCircle,
  Navigation,
  MessageSquare,
  Timer,
  Send
} from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import { apiService } from '../services/api';
import { useToast } from '@/hooks/use-toast';
import DeliveryTrajectoryMap from './DeliveryTrajectoryMap';
import { useAuth } from '../contexts/AuthContext';

interface DeliveryStatusUpdaterProps {
  order: {
    _id: string;
    status: string;
    user: {
      _id: string;
      name: string;
      phone?: string;
      email: string;
    };
    deliveryAddress: string;
    estimatedDeliveryTime?: string;
    deliveryNotes?: string;
  } | any; // Allow any Order type for flexibility
  onStatusUpdate?: (newStatus: string) => void;
}

// Simple geocoding function for demonstration
const getDeliveryAddressCoords = (address: string) => {
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
    return { lat: 40.7128, lng: -74.0060 };
  }
};

const DeliveryStatusUpdater: React.FC<DeliveryStatusUpdaterProps> = ({ 
  order, 
  onStatusUpdate 
}) => {
  const [currentStatus, setCurrentStatus] = useState(order.status);
  const [deliveryNotes, setDeliveryNotes] = useState(order.deliveryNotes || '');
  const [estimatedTime, setEstimatedTime] = useState(order.estimatedDeliveryTime || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [autoLocationSharing, setAutoLocationSharing] = useState(true);
  const [locationSharingInterval, setLocationSharingInterval] = useState<NodeJS.Timeout | null>(null);
  const { socket } = useSocket();
  const { toast } = useToast();
  const { user } = useAuth();

  // Get current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          setLocationError('Unable to get your location');
          console.error('Location error:', error);
        }
      );
    } else {
      setLocationError('Geolocation is not supported by this browser');
    }
  }, []);

  // Periodic location sharing when out for delivery (only if auto-sharing is enabled)
  useEffect(() => {
    if (currentStatus === 'out_for_delivery' && location && socket && autoLocationSharing) {
      const interval = setInterval(async () => {
        try {
          // Get fresh location
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const newLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              };
              
              // Update local state
              setLocation(newLocation);
              
              // Save to database
              await apiService.updateLocation({
                latitude: newLocation.lat,
                longitude: newLocation.lng,
                accuracy: position.coords.accuracy || 10,
                speed: position.coords.speed || 0,
                heading: position.coords.heading || 0,
                isActive: true
              });
              
              // Emit real-time update
              socket.emit('location-update', {
                orderId: order._id,
                location: newLocation,
                timestamp: new Date().toISOString()
              });
              
              console.log('📍 Auto location shared:', newLocation);
            },
            (error) => {
              console.error('Error getting location:', error);
            }
          );
        } catch (error) {
          console.error('Error sharing location:', error);
        }
      }, 30000); // Share location every 30 seconds

      setLocationSharingInterval(interval);
      return () => {
        clearInterval(interval);
        setLocationSharingInterval(null);
      };
    } else if (locationSharingInterval) {
      // Clear interval if auto-sharing is disabled
      clearInterval(locationSharingInterval);
      setLocationSharingInterval(null);
    }
  }, [currentStatus, location, socket, order._id, autoLocationSharing]);

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'ready':
        return 'out_for_delivery';
      case 'out_for_delivery':
        return 'delivered';
      default:
        return currentStatus;
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'ready':
        return {
          icon: <AlertCircle className="h-5 w-5" />,
          color: 'bg-purple-100 text-purple-800',
          text: 'Ready for Pickup',
          action: 'Start Delivery',
          description: 'Order is ready and waiting for pickup'
        };
      case 'out_for_delivery':
        return {
          icon: <Truck className="h-5 w-5" />,
          color: 'bg-green-100 text-green-800',
          text: 'Out for Delivery',
          action: 'Mark as Delivered',
          description: 'Order is on its way to customer'
        };
      case 'delivered':
        return {
          icon: <CheckCircle className="h-5 w-5" />,
          color: 'bg-green-100 text-green-800',
          text: 'Delivered',
          action: 'Completed',
          description: 'Order has been delivered successfully'
        };
      default:
        return {
          icon: <Clock className="h-5 w-5" />,
          color: 'bg-gray-100 text-gray-800',
          text: 'Unknown',
          action: 'Update',
          description: 'Unknown status'
        };
    }
  };

  const handleStatusUpdate = async () => {
    if (isUpdating) return;

    const nextStatus = getNextStatus(currentStatus);
    if (nextStatus === currentStatus) return;

    setIsUpdating(true);
    
    try {
      const updateData: any = {
        status: nextStatus
      };

      if (nextStatus === 'out_for_delivery') {
        if (estimatedTime) {
          updateData.estimatedDeliveryTime = estimatedTime;
        }
        if (deliveryNotes) {
          updateData.deliveryNotes = deliveryNotes;
        }
        
        // Automatically share location when starting delivery
        if (location) {
          try {
            await apiService.updateLocation({
              latitude: location.lat,
              longitude: location.lng,
              accuracy: 10,
              speed: 0,
              heading: 0,
              isActive: true
            });
            
            // Emit location update
            if (socket) {
              socket.emit('location-update', {
                orderId: order._id,
                location,
                timestamp: new Date().toISOString()
              });
            }
          } catch (error) {
            console.error('Error sharing location:', error);
          }
        }
      }

      if (nextStatus === 'delivered') {
        updateData.actualDeliveryTime = new Date().toISOString();
      }

      // Update order status
      await apiService.updateOrderStatus(order._id, updateData);

      // Emit real-time update
      if (socket) {
        socket.emit('delivery-update', {
          orderId: order._id,
          status: nextStatus,
          deliveryNotes,
          estimatedDeliveryTime: estimatedTime,
          actualDeliveryTime: nextStatus === 'delivered' ? new Date().toISOString() : undefined,
          location
        });
      }

      setCurrentStatus(nextStatus);
      onStatusUpdate?.(nextStatus);

      toast({
        title: "Status Updated",
        description: `Order status updated to ${nextStatus.replace('_', ' ')}`,
      });

    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update order status",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSendLocation = async () => {
    if (!location || !socket) return;

    try {
      // Save location to database
      await apiService.updateLocation({
        latitude: location.lat,
        longitude: location.lng,
        accuracy: 10, // Default accuracy
        speed: 0,
        heading: 0,
        isActive: true
      });

      // Emit real-time update
      socket.emit('location-update', {
        orderId: order._id,
        location,
        timestamp: new Date().toISOString()
      });

      toast({
        title: "Location Sent",
        description: "Your current location has been shared with the customer",
      });
    } catch (error) {
      console.error('Error saving location:', error);
      toast({
        title: "Location Error",
        description: "Failed to save your location",
        variant: "destructive"
      });
    }
  };

  const statusInfo = getStatusInfo(currentStatus);
  const canUpdate = ['ready', 'out_for_delivery'].includes(currentStatus);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-6 w-6" />
          Delivery Status Update
        </CardTitle>
        <p className="text-green-100">Order #{order._id.slice(-6)}</p>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Current Status */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Badge className={`${statusInfo.color} text-sm font-semibold px-3 py-1`}>
              {statusInfo.icon}
              <span className="ml-2">{statusInfo.text}</span>
            </Badge>
          </div>
          <p className="text-gray-600 text-sm">{statusInfo.description}</p>
        </div>

        {/* Customer Information */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Navigation className="h-4 w-4" />
            Customer Information
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Customer:</span>
              <span className="font-medium">{order.user.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Phone:</span>
              <a href={`tel:${order.user.phone}`} className="font-medium text-blue-600 hover:underline">
                {order.user.phone}
              </a>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <a href={`mailto:${order.user.email}`} className="font-medium text-blue-600 hover:underline">
                {order.user.email}
              </a>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Address:</span>
              <span className="font-medium text-right max-w-xs">{order.deliveryAddress}</span>
            </div>
            {order.customerLocation && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Customer GPS Location</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Coordinates:</span>
                    <span className="font-mono text-blue-800">
                      {order.customerLocation.latitude && order.customerLocation.longitude ? 
                        `${order.customerLocation.latitude.toFixed(6)}, ${order.customerLocation.longitude.toFixed(6)}` :
                        'Location not available'
                      }
                    </span>
                  </div>
                  {order.customerLocation.accuracy && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Accuracy:</span>
                      <span className="text-blue-800">±{Math.round(order.customerLocation.accuracy)}m</span>
                    </div>
                  )}
                  {order.customerLocation.timestamp && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Captured:</span>
                      <span className="text-blue-800">
                        {new Date(order.customerLocation.timestamp).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Location Information */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Your Location
          </h3>
          {location ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
                </p>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSendLocation}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="h-3 w-3 mr-1" />
                    Share Now
                  </Button>
                </div>
              </div>
              
              {/* Location Sharing Controls */}
              {currentStatus === 'out_for_delivery' && (
                <div className="border-t border-blue-200 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">Location Sharing</h4>
                      <p className="text-xs text-gray-600">Control how often you share your location</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="autoLocationSharing"
                        checked={autoLocationSharing}
                        onChange={(e) => setAutoLocationSharing(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="autoLocationSharing" className="text-sm text-gray-700">
                        Auto-share every 30s
                      </label>
                    </div>
                  </div>
                  
                  {autoLocationSharing ? (
                    <div className="flex items-center gap-2 text-green-600 text-xs">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>Location sharing automatically every 30 seconds</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-orange-600 text-xs">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span>Manual location sharing only</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-red-600">
              {locationError || 'Getting your location...'}
            </div>
          )}
        </div>

        {/* Customer Location Information */}
        {order.customerLocation && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Customer Location
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Coordinates:</span>
                <span className="font-mono text-gray-800">
                  {order.customerLocation.latitude && order.customerLocation.longitude ? 
                    `${order.customerLocation.latitude.toFixed(6)}, ${order.customerLocation.longitude.toFixed(6)}` :
                    'Location not available'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Accuracy:</span>
                <span className="text-gray-800">±{order.customerLocation.accuracy || 10}m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Captured:</span>
                <span className="text-gray-800">
                  {new Date(order.customerLocation.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Delivery Map */}
        {currentStatus === 'out_for_delivery' && location && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Delivery Map
            </h3>
            <div className="h-64 rounded-lg overflow-hidden border border-gray-200">
              <DeliveryTrajectoryMap
                orderId={order._id}
                deliveryManId={user?._id || ''}
                deliveryAddress={order.deliveryAddress}
                deliveryAddressCoords={order.customerLocation ? {
                  lat: order.customerLocation.latitude,
                  lng: order.customerLocation.longitude
                } : getDeliveryAddressCoords(order.deliveryAddress)}
                onLocationUpdate={(location) => {
                  console.log('Location update in delivery map:', location);
                }}
              />
            </div>
          </div>
        )}

        {/* Delivery Details Form */}
        {canUpdate && (
          <div className="mb-6 space-y-4">
            <div>
              <Label htmlFor="estimatedTime">Estimated Delivery Time</Label>
              <Input
                id="estimatedTime"
                type="datetime-local"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="deliveryNotes">Delivery Notes (Optional)</Label>
              <Textarea
                id="deliveryNotes"
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="Add any notes about the delivery..."
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Action Button */}
        {canUpdate && (
          <Button
            onClick={handleStatusUpdate}
            disabled={isUpdating}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isUpdating ? (
              <>
                <Timer className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                {statusInfo.action}
              </>
            )}
          </Button>
        )}

        {currentStatus === 'delivered' && (
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-green-800 font-medium">Delivery Completed!</p>
            <p className="text-green-600 text-sm">This order has been successfully delivered.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DeliveryStatusUpdater;
