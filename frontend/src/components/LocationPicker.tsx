import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin, Navigation, X, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { reverseGeocode, getCurrentLocation } from '@/utils/reverseGeocoding';
import { calculateDistance, formatDistance } from '@/utils/distanceCalculator';
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

  // Default center (Tunis, Tunisia)
  const defaultCenter: [number, number] = [36.8065, 10.1815];

  useEffect(() => {
    if (isOpen) {
      setStep('method');
      setSelectedLocation(initialLocation || null);
      setAddress('');
      setError('');
    }
  }, [isOpen, initialLocation]);

  const handleUseCurrentLocation = async () => {
    setIsLoading(true);
    setError('');

    try {
      const location = await getCurrentLocation();
      setCurrentLocation(location);
      setSelectedLocation(location);
      
      // Get address for current location
      const geocodeResult = await reverseGeocode(location.latitude, location.longitude);
      setAddress(geocodeResult.address);
      setAccuracy(geocodeResult.accuracy);
      
      setStep('map');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get current location');
    } finally {
      setIsLoading(false);
    }
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get address');
    } finally {
      setIsLoading(false);
    }
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
      <DialogContent className="max-w-4xl w-full h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-6 w-6 text-italian-green-600" />
            Select Delivery Location
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {step === 'method' && (
            <div className="p-6 space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  How would you like to select your location?
                </h3>
                <p className="text-gray-600">
                  Choose your preferred method to set the delivery address
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-italian-green-300"
                  onClick={handleUseCurrentLocation}
                >
                  <CardContent className="p-6 text-center">
                    <Navigation className="h-12 w-12 text-italian-green-600 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      Use Current Location
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Automatically detect your current position using GPS
                    </p>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-italian-green-300"
                  onClick={handleChooseOnMap}
                >
                  <CardContent className="p-6 text-center">
                    <MapPin className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      Choose on Map
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Click anywhere on the map to select your location
                    </p>
                  </CardContent>
                </Card>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="text-red-700">{error}</span>
                </div>
              )}
            </div>
          )}

          {step === 'map' && (
            <div className="h-full flex flex-col">
              <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStep('method')}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <span className="text-sm text-gray-600">
                      Click on the map to select your location
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-1 relative">
                <MapContainer
                  center={getMapCenter()}
                  zoom={15}
                  className="h-full w-full"
                  scrollWheelZoom={true}
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
                    <div className="flex items-center gap-2 bg-white p-4 rounded-lg shadow-lg">
                      <Loader2 className="h-5 w-5 animate-spin text-italian-green-600" />
                      <span className="text-gray-700">Getting address...</span>
                    </div>
                  </div>
                )}
              </div>

              {selectedLocation && address && (
                <div className="p-4 border-t bg-gray-50">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Selected Location:</p>
                        <p className="text-sm text-gray-600 break-words">{address}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Accuracy: ±{Math.round(accuracy)}m
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleConfirmLocation}
                        className="flex-1 bg-italian-green-600 hover:bg-italian-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Confirm Location
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setStep('method')}
                      >
                        Change Method
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 border-t bg-red-50">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="h-5 w-5" />
                    <span className="text-sm">{error}</span>
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
