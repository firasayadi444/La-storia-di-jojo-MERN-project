import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Navigation } from 'lucide-react';
import LocationPicker from './LocationPicker';

const LocationTest: React.FC = () => {
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
    accuracy: number;
  } | null>(null);

  const handleLocationSelect = (location: {
    latitude: number;
    longitude: number;
    address: string;
    accuracy: number;
  }) => {
    setSelectedLocation(location);
    console.log('📍 Location selected:', location);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-6 w-6 text-italian-green-600" />
            Location Picker Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => setShowLocationPicker(true)}
            className="w-full"
          >
            <Navigation className="h-4 w-4 mr-2" />
            Test Location Picker
          </Button>

          {selectedLocation && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">✅ Location Selected Successfully!</h3>
              <div className="space-y-1 text-sm">
                <p><strong>Address:</strong> {selectedLocation.address}</p>
                <p><strong>Coordinates:</strong> {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}</p>
                <p><strong>Accuracy:</strong> ±{Math.round(selectedLocation.accuracy)}m</p>
              </div>
            </div>
          )}

          <div className="text-sm text-gray-600">
            <p><strong>Test Instructions:</strong></p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Click "Test Location Picker" to open the location picker</li>
              <li>Try "Use Current Location" - it should auto-save and close</li>
              <li>Try "Choose on Map" - select a location and click "Save & Continue"</li>
              <li>Try selecting from "Recent Locations" if available</li>
              <li>The selected location should appear above after closing the picker</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <LocationPicker
        isOpen={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onLocationSelect={handleLocationSelect}
        initialLocation={selectedLocation || undefined}
      />
    </div>
  );
};

export default LocationTest;

