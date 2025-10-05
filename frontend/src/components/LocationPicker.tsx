import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin, Navigation, X, Loader2, AlertCircle, CheckCircle, Smartphone, Map, RefreshCw, ExternalLink } from 'lucide-react';
import { reverseGeocode, getCurrentLocation } from '@/utils/reverseGeocoding';
import { calculateDistance, formatDistance } from '@/utils/distanceCalculator';
import { locationService } from '@/services/locationService';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom red marker icon
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface LocationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (location: {
    latitude: number;
    longitude: number;
    address: string;
    accuracy: number;
  }) => void;
  initialLocation?: {
    latitude: number;
    longitude: number;
  };
}

interface MapClickHandlerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  selectedLocation: { latitude: number; longitude: number } | null;
}

const MapClickHandler: React.FC<MapClickHandlerProps> = ({ onLocationSelect, selectedLocation }) => {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return null;
};

const MapCenter: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, 15);
  }, [map, center]);

  return null;
};

const LocationPicker: React.FC<LocationPickerProps> = ({
  isOpen,
  onClose,
  onLocationSelect,
  initialLocation
}) => {
  const [step, setStep] = useState<'method' | 'map'>('method');
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(
    initialLocation || null
  );
  const [address, setAddress] = useState<string>('');
  const [accuracy, setAccuracy] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown');
  const [isRetrying, setIsRetrying] = useState(false);
  const [locationHistory, setLocationHistory] = useState<Array<{latitude: number, longitude: number, address: string, timestamp: string}>>([]);

  // Default center (Tunis, Tunisia)
  const defaultCenter: [number, number] = [36.8065, 10.1815];

  useEffect(() => {
    if (isOpen) {
      setStep('method');
      setSelectedLocation(initialLocation || null);
      setAddress('');
      setError('');
      checkGeolocationPermission();
      loadLocationHistory();
    }
  }, [isOpen, initialLocation]);

  // Check geolocation permission status
  const checkGeolocationPermission = async () => {
    if (!navigator.permissions) {
      setPermissionStatus('unknown');
      return;
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      setPermissionStatus(permission.state);
      
      permission.onchange = () => {
        setPermissionStatus(permission.state);
      };
    } catch (error) {
      console.warn('Permission API not supported:', error);
      setPermissionStatus('unknown');
    }
  };

  // Load location history from localStorage
  const loadLocationHistory = () => {
    try {
      const history = localStorage.getItem('locationHistory');
      if (history) {
        setLocationHistory(JSON.parse(history));
      }
    } catch (error) {
      console.warn('Failed to load location history:', error);
    }
  };

  // Save location to history
  const saveToHistory = (location: {latitude: number, longitude: number, address: string}) => {
    const newEntry = {
      ...location,
      timestamp: new Date().toISOString()
    };
    
    const updatedHistory = [newEntry, ...locationHistory.slice(0, 4)]; // Keep last 5 locations
    setLocationHistory(updatedHistory);
    
    try {
      localStorage.setItem('locationHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.warn('Failed to save location history:', error);
    }
  };

  const handleUseCurrentLocation = async () => {
    setIsLoading(true);
    setError('');
    setIsRetrying(false);

    try {
      // Use the improved location service with better error handling
      const location = await locationService.getCurrentLocation();
      setCurrentLocation(location);
      setSelectedLocation(location);
      
      // Get address for current location
      const geocodeResult = await reverseGeocode(location.latitude, location.longitude);
      setAddress(geocodeResult.address);
      setAccuracy(geocodeResult.accuracy);
      
      // Save to history
      saveToHistory({
        latitude: location.latitude,
        longitude: location.longitude,
        address: geocodeResult.address
      });
      
      // Automatically confirm and close if we have both location and address
      if (location && geocodeResult.address) {
        onLocationSelect({
          latitude: location.latitude,
          longitude: location.longitude,
          address: geocodeResult.address,
          accuracy: geocodeResult.accuracy
        });
        onClose();
        return;
      }
      
      setStep('map');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get current location';
      
      // Provide more specific error messages
      if (errorMessage.includes('denied') || errorMessage.includes('permission')) {
        setError('Location access denied. Please enable location permissions in your browser settings and try again.');
        setPermissionStatus('denied');
      } else if (errorMessage.includes('timeout')) {
        setError('Location request timed out. Please check your internet connection and try again.');
        setIsRetrying(true);
      } else if (errorMessage.includes('unavailable')) {
        setError('Location services are currently unavailable. Please try again later or select your location on the map.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryLocation = async () => {
    setIsRetrying(false);
    await handleUseCurrentLocation();
  };

  const handleChooseOnMap = () => {
    setStep('map');
    setError('');
  };

  const handleMapClick = async (lat: number, lng: number) => {
    setSelectedLocation({ latitude: lat, longitude: lng });
    setIsLoading(true);
    setError('');

    try {
      const geocodeResult = await reverseGeocode(lat, lng);
      setAddress(geocodeResult.address);
      setAccuracy(geocodeResult.accuracy);
      
      // Save to history
      saveToHistory({
        latitude: lat,
        longitude: lng,
        address: geocodeResult.address
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get address');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectFromHistory = async (historyItem: {latitude: number, longitude: number, address: string}) => {
    setSelectedLocation({ latitude: historyItem.latitude, longitude: historyItem.longitude });
    setAddress(historyItem.address);
    setAccuracy(10); // Default accuracy for history items
    
    // Automatically confirm and close for history items
    onLocationSelect({
      latitude: historyItem.latitude,
      longitude: historyItem.longitude,
      address: historyItem.address,
      accuracy: 10
    });
    onClose();
  };

  const handleConfirmLocation = () => {
    if (selectedLocation && address) {
      onLocationSelect({
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        address,
        accuracy
      });
      onClose();
    }
  };

  const getMapCenter = (): [number, number] => {
    if (selectedLocation) {
      return [selectedLocation.latitude, selectedLocation.longitude];
    }
    if (currentLocation) {
      return [currentLocation.latitude, currentLocation.longitude];
    }
    return defaultCenter;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[95vh] sm:h-[90vh] p-0">
        <DialogHeader className="p-4 sm:p-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-italian-green-600" />
            Select Delivery Location
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {step === 'method' && (
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div className="text-center">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                  How would you like to select your location?
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Choose your preferred method to set the delivery address
                </p>
              </div>

              {/* Recent Locations */}
              {locationHistory.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Recent Locations
                  </h4>
                  <div className="space-y-2">
                    {locationHistory.slice(0, 3).map((item, index) => (
                      <Card 
                        key={index}
                        className="cursor-pointer hover:shadow-md transition-all duration-200 border hover:border-italian-green-300"
                        onClick={() => handleSelectFromHistory(item)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {item.address}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(item.timestamp).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Card 
                  className={`cursor-pointer hover:shadow-lg transition-all duration-200 border-2 ${
                    permissionStatus === 'denied' 
                      ? 'border-red-200 bg-red-50' 
                      : 'hover:border-italian-green-300'
                  }`}
                  onClick={permissionStatus === 'denied' ? undefined : handleUseCurrentLocation}
                >
                  <CardContent className="p-4 sm:p-6 text-center">
                    <div className="flex flex-col items-center">
                      {permissionStatus === 'denied' ? (
                        <AlertCircle className="h-8 w-8 sm:h-12 sm:w-12 text-red-500 mx-auto mb-3 sm:mb-4" />
                      ) : (
                        <Navigation className="h-8 w-8 sm:h-12 sm:w-12 text-italian-green-600 mx-auto mb-3 sm:mb-4" />
                      )}
                      <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                        {permissionStatus === 'denied' ? 'Location Blocked' : 'Use Current Location'}
                      </h4>
                      <p className="text-gray-600 text-xs sm:text-sm mb-3">
                        {permissionStatus === 'denied' 
                          ? 'Enable location permissions in browser settings'
                          : 'Automatically detect and save your current position'
                        }
                      </p>
                      {permissionStatus === 'denied' ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open('chrome://settings/content/location', '_blank');
                          }}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Open Settings
                        </Button>
                      ) : (
                        <div className="text-xs text-italian-green-600 font-medium">
                          ✨ Auto-save enabled
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-italian-green-300"
                  onClick={handleChooseOnMap}
                >
                  <CardContent className="p-4 sm:p-6 text-center">
                    <Map className="h-8 w-8 sm:h-12 sm:w-12 text-blue-600 mx-auto mb-3 sm:mb-4" />
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                      Choose on Map
                    </h4>
                    <p className="text-gray-600 text-xs sm:text-sm">
                      Click anywhere on the map to select your location
                    </p>
                  </CardContent>
                </Card>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-red-700 text-sm sm:text-base">{error}</span>
                      {isRetrying && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2 text-xs"
                          onClick={handleRetryLocation}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Try Again
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'map' && (
            <div className="h-full flex flex-col">
              <div className="p-3 sm:p-4 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStep('method')}
                      className="text-xs sm:text-sm"
                    >
                      <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Back
                    </Button>
                    <span className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                      Click on the map to select your location
                    </span>
                    <span className="text-xs text-gray-600 sm:hidden">
                      Tap to select
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUseCurrentLocation}
                    className="text-xs sm:text-sm"
                    disabled={isLoading}
                  >
                    <Navigation className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    My Location
                  </Button>
                </div>
              </div>

              <div className="flex-1 relative">
                <MapContainer
                  center={getMapCenter()}
                  zoom={15}
                  className="h-full w-full"
                  scrollWheelZoom={true}
                  touchZoom={true}
                  doubleClickZoom={true}
                  zoomControl={true}
                >
                  <MapCenter center={getMapCenter()} />
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  
                  <MapClickHandler
                    onLocationSelect={handleMapClick}
                    selectedLocation={selectedLocation}
                  />
                  
                  {selectedLocation && (
                    <Marker
                      position={[selectedLocation.latitude, selectedLocation.longitude]}
                      icon={redIcon}
                    />
                  )}
                </MapContainer>

                {isLoading && (
                  <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                    <div className="flex items-center gap-2 bg-white p-3 sm:p-4 rounded-lg shadow-lg mx-4">
                      <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-italian-green-600" />
                      <span className="text-sm sm:text-base text-gray-700">Getting address...</span>
                    </div>
                  </div>
                )}
              </div>

              {selectedLocation && address && (
                <div className="p-3 sm:p-4 border-t bg-green-50">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm sm:text-base">✅ Location Ready!</p>
                        <p className="text-xs sm:text-sm text-gray-600 break-words">{address}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Accuracy: ±{Math.round(accuracy)}m
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        onClick={handleConfirmLocation}
                        className="flex-1 bg-italian-green-600 hover:bg-italian-green-700 text-sm sm:text-base font-medium"
                      >
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        Save & Continue
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setStep('method')}
                        className="text-xs sm:text-sm"
                      >
                        Change Method
                      </Button>
                    </div>
                    
                    <div className="text-xs text-gray-500 text-center">
                      This location will be saved to your order
                    </div>
                  </div>
                </div>
              )}

              {/* Show confirmation button even if address is loading */}
              {selectedLocation && !address && !isLoading && (
                <div className="p-3 sm:p-4 border-t bg-yellow-50">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm sm:text-base">Location Selected</p>
                        <p className="text-xs sm:text-sm text-gray-600">
                          Getting address details...
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => setStep('method')}
                      variant="outline"
                      className="w-full text-xs sm:text-sm"
                    >
                      Choose Different Method
                    </Button>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 sm:p-4 border-t bg-red-50">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-red-700">{error}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LocationPicker;
