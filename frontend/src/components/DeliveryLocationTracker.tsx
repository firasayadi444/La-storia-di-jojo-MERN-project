import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  Route,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '../services/api';
import { useSocket } from '../contexts/SocketContext';

interface DeliveryLocationTrackerProps {
  orderId: string;
  isActive: boolean;
  onLocationUpdate?: (location: any) => void;
}

const DeliveryLocationTracker: React.FC<DeliveryLocationTrackerProps> = ({
  orderId,
  isActive,
  onLocationUpdate
}) => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: string;
  } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const { toast } = useToast();
  const { socket } = useSocket();

  // Start location tracking
  const startTracking = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      return;
    }

    setIsTracking(true);
    setLocationError(null);

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    };

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy, speed, heading } = position.coords;
        
        // Filter out inaccurate locations
        if (accuracy > 100) {
          console.warn('Location accuracy too low:', accuracy);
          return;
        }

        const location = {
          latitude,
          longitude,
          accuracy: Math.round(accuracy),
          speed: speed || 0,
          heading: heading || 0
        };

        setCurrentLocation({
          ...location,
          timestamp: new Date().toISOString()
        });

        // Update location on server
        try {
          setIsUpdating(true);
          const response = await apiService.updateDeliveryLocation(orderId, location);
          
          if (response.success) {
            onLocationUpdate?.(response.data.location);
            toast({
              title: "Location Updated",
              description: `Accuracy: ±${Math.round(accuracy)}m`,
            });
          }
        } catch (error: any) {
          console.error('Error updating location:', error);
          toast({
            title: "Location Update Failed",
            description: error.message || "Failed to update location",
            variant: "destructive"
          });
        } finally {
          setIsUpdating(false);
        }
      },
      (error) => {
        setIsTracking(false);
        let errorMessage = 'Unable to get your location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please allow location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        
        setLocationError(errorMessage);
        toast({
          title: "Location Error",
          description: errorMessage,
          variant: "destructive"
        });
      },
      options
    );

    // Store watch ID for cleanup
    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  };

  // Stop location tracking
  const stopTracking = () => {
    setIsTracking(false);
    setCurrentLocation(null);
    setLocationError(null);
  };

  // Manual location update
  const updateLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      return;
    }

    try {
      setIsUpdating(true);
      setLocationError(null);

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      const { latitude, longitude, accuracy, speed, heading } = position.coords;
      
      if (accuracy > 100) {
        throw new Error('Location accuracy too low. Please try again.');
      }

      const location = {
        latitude,
        longitude,
        accuracy: Math.round(accuracy),
        speed: speed || 0,
        heading: heading || 0
      };

      const response = await apiService.updateDeliveryLocation(orderId, location);
      
      if (response.success) {
        setCurrentLocation({
          ...location,
          timestamp: new Date().toISOString()
        });
        
        onLocationUpdate?.(response.data.location);
        
        toast({
          title: "Location Updated",
          description: `Accuracy: ±${Math.round(accuracy)}m`,
        });
      }
    } catch (error: any) {
      console.error('Error updating location:', error);
      setLocationError(error.message);
      toast({
        title: "Location Update Failed",
        description: error.message || "Failed to update location",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Auto-start tracking when component becomes active
  useEffect(() => {
    if (isActive && !isTracking) {
      startTracking();
    } else if (!isActive && isTracking) {
      stopTracking();
    }
  }, [isActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isTracking) {
        stopTracking();
      }
    };
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="h-5 w-5" />
          Location Tracking
          {isTracking && (
            <Badge className="bg-green-100 text-green-800">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1" />
              Live
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Location Display */}
        {currentLocation && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-blue-500" />
              <span className="font-medium">Current Location</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Coordinates:</span>
                <div className="font-mono text-blue-800">
                  {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Accuracy:</span>
                <div className={`font-medium ${
                  currentLocation.accuracy <= 10 ? 'text-green-600' :
                  currentLocation.accuracy <= 50 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  ±{currentLocation.accuracy}m
                </div>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Last updated: {new Date(currentLocation.timestamp).toLocaleTimeString()}
            </div>
          </div>
        )}

        {/* Error Display */}
        {locationError && (
          <div className="bg-red-50 p-3 rounded-lg border border-red-200">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Location Error</span>
            </div>
            <p className="text-sm text-red-700 mt-1">{locationError}</p>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-2">
          {!isTracking ? (
            <Button
              onClick={startTracking}
              disabled={!isActive}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Navigation className="h-4 w-4 mr-2" />
              Start Tracking
            </Button>
          ) : (
            <Button
              onClick={stopTracking}
              variant="destructive"
              className="flex-1"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Stop Tracking
            </Button>
          )}
          
          <Button
            onClick={updateLocation}
            disabled={!isActive || isUpdating}
            variant="outline"
            className="flex-1"
          >
            {isUpdating ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Update Now
          </Button>
        </div>

        {/* Status Information */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Location tracking helps customers see your real-time position</p>
          <p>• Updates are sent every 30 seconds when tracking is active</p>
          <p>• High accuracy GPS is recommended for best results</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeliveryLocationTracker;
