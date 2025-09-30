import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Navigation, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface CustomerLocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number; accuracy?: number }) => void;
  onClose?: () => void;
  initialLocation?: { lat: number; lng: number };
  isOpen: boolean;
}

// Tunisia bounds for the map
const TUNISIA_BOUNDS: [[number, number], [number, number]] = [
  [30.2, 7.5], // Southwest corner
  [37.5, 11.6] // Northeast corner
];

// Major cities in Tunisia for reference
const TUNISIA_CITIES = [
  { name: 'Tunis', lat: 36.8065, lng: 10.1815 },
  { name: 'Sfax', lat: 34.7406, lng: 10.7603 },
  { name: 'Sousse', lat: 35.8256, lng: 10.6411 },
  { name: 'Kairouan', lat: 35.6711, lng: 10.1006 },
  { name: 'Bizerte', lat: 37.2744, lng: 9.8739 },
  { name: 'Gabès', lat: 33.8886, lng: 10.0972 },
  { name: 'Gafsa', lat: 34.4256, lng: 8.7842 },
  { name: 'Monastir', lat: 35.7781, lng: 10.8262 },
  { name: 'Ariana', lat: 36.8665, lng: 10.1647 },
  { name: 'Ben Arous', lat: 36.7531, lng: 10.2189 }
];

const MapClickHandler: React.FC<{
  onLocationSelect: (location: { lat: number; lng: number }) => void;
}> = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onLocationSelect({ lat, lng });
    },
  });
  return null;
};

const CustomerLocationPicker: React.FC<CustomerLocationPickerProps> = ({
  onLocationSelect,
  onClose,
  initialLocation,
  isOpen
}) => {
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(
    initialLocation || null
  );
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [geolocationError, setGeolocationError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([36.8065, 10.1815]); // Tunis center
  const mapRef = useRef<L.Map>(null);
  const { toast } = useToast();

  // Set initial map center if location is provided
  useEffect(() => {
    if (initialLocation) {
      setMapCenter([initialLocation.lat, initialLocation.lng]);
      setSelectedLocation(initialLocation);
    }
  }, [initialLocation]);

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      setGeolocationError('Geolocation is not supported by this browser');
      return;
    }

    setIsGeolocating(true);
    setGeolocationError(null);

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const location = { lat: latitude, lng: longitude, accuracy };
        
        setSelectedLocation(location);
        setMapCenter([latitude, longitude]);
        
        // Center map on user location
        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], 15);
        }
        
        setIsGeolocating(false);
        toast({
          title: "Location found!",
          description: `Accuracy: ±${Math.round(accuracy)}m`,
        });
      },
      (error) => {
        setIsGeolocating(false);
        let errorMessage = 'Unable to get your location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please allow location access or select manually.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable. Please select manually.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again or select manually.';
            break;
        }
        
        setGeolocationError(errorMessage);
        toast({
          title: "Location Error",
          description: errorMessage,
          variant: "destructive"
        });
      },
      options
    );
  };

  const handleMapClick = (location: { lat: number; lng: number }) => {
    setSelectedLocation(location);
    setGeolocationError(null);
  };

  const handleConfirmLocation = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
      toast({
        title: "Location selected!",
        description: `Lat: ${selectedLocation.lat.toFixed(6)}, Lng: ${selectedLocation.lng.toFixed(6)}`,
      });
    }
  };

  const handleCitySelect = (city: { name: string; lat: number; lng: number }) => {
    const location = { lat: city.lat, lng: city.lng };
    setSelectedLocation(location);
    setMapCenter([city.lat, city.lng]);
    
    if (mapRef.current) {
      mapRef.current.setView([city.lat, city.lng], 12);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-6 w-6" />
              Select Your Location
            </CardTitle>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="text-blue-100">
            Click on the map to select your delivery location or use your current position
          </p>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row h-[70vh]">
            {/* Map Section */}
            <div className="flex-1 relative">
              <MapContainer
                center={mapCenter}
                zoom={8}
                style={{ height: '100%', width: '100%' }}
                bounds={TUNISIA_BOUNDS}
                ref={mapRef}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                <MapClickHandler onLocationSelect={handleMapClick} />
                
                {selectedLocation && (
                  <Marker
                    position={[selectedLocation.lat, selectedLocation.lng]}
                    icon={L.divIcon({
                      className: 'custom-marker',
                      html: '<div class="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center"><div class="w-2 h-2 bg-white rounded-full"></div></div>',
                      iconSize: [24, 24],
                      iconAnchor: [12, 12]
                    })}
                  />
                )}
              </MapContainer>
              
              {/* Map overlay with controls */}
              <div className="absolute top-4 left-4 right-4 flex flex-wrap gap-2">
                <Button
                  onClick={handleGeolocation}
                  disabled={isGeolocating}
                  size="sm"
                  className="bg-white text-gray-800 hover:bg-gray-100 shadow-lg"
                >
                  {isGeolocating ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Navigation className="h-4 w-4 mr-2" />
                  )}
                  {isGeolocating ? 'Getting Location...' : 'Use My Location'}
                </Button>
                
                {geolocationError && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {geolocationError}
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Sidebar with cities and location info */}
            <div className="w-full lg:w-80 bg-gray-50 p-4 overflow-y-auto">
              <div className="space-y-4">
                {/* Selected Location Info */}
                {selectedLocation && (
                  <div className="bg-white p-3 rounded-lg border">
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Selected Location
                    </h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Latitude:</strong> {selectedLocation.lat.toFixed(6)}</p>
                      <p><strong>Longitude:</strong> {selectedLocation.lng.toFixed(6)}</p>
                      {selectedLocation.accuracy && (
                        <p><strong>Accuracy:</strong> ±{Math.round(selectedLocation.accuracy)}m</p>
                      )}
                    </div>
                    <Button
                      onClick={handleConfirmLocation}
                      className="w-full mt-3 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirm This Location
                    </Button>
                  </div>
                )}
                
                {/* Major Cities */}
                <div className="bg-white p-3 rounded-lg border">
                  <h3 className="font-semibold text-gray-900 mb-3">Quick Select Cities</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {TUNISIA_CITIES.map((city) => (
                      <Button
                        key={city.name}
                        variant="outline"
                        size="sm"
                        onClick={() => handleCitySelect(city)}
                        className="justify-start text-left h-auto p-2"
                      >
                        <MapPin className="h-3 w-3 mr-2 text-blue-500" />
                        <div>
                          <div className="font-medium">{city.name}</div>
                          <div className="text-xs text-gray-500">
                            {city.lat.toFixed(4)}, {city.lng.toFixed(4)}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
                
                {/* Instructions */}
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2">Instructions</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Click "Use My Location" for automatic detection</li>
                    <li>• Click anywhere on the map to select manually</li>
                    <li>• Choose from major cities for quick selection</li>
                    <li>• Confirm your selection when ready</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerLocationPicker;
