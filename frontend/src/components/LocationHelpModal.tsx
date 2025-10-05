import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Smartphone, Wifi, Settings, CheckCircle, AlertTriangle } from 'lucide-react';

interface LocationHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LocationHelpModal: React.FC<LocationHelpModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-6 w-6 text-italian-green-600" />
            Location Help & Troubleshooting
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Why location is important */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Why accurate location matters
              </h3>
              <p className="text-sm text-gray-600">
                Precise location helps us deliver your order faster and to the correct address. 
                It also helps our delivery team find you easily.
              </p>
            </CardContent>
          </Card>

          {/* Common issues and solutions */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Common Issues & Solutions</h3>
            
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-blue-600" />
                  Location permission denied
                </h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Solution:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Check your browser settings and allow location access</li>
                    <li>Look for the location icon in your browser's address bar</li>
                    <li>Try refreshing the page and allow location when prompted</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-green-600" />
                  Poor GPS signal
                </h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Solution:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Move to an open area or near a window</li>
                    <li>Wait 10-15 seconds for GPS to lock onto satellites</li>
                    <li>Make sure you're not in a basement or underground</li>
                    <li>Try using WiFi instead of mobile data</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <Settings className="h-4 w-4 text-purple-600" />
                  Location seems wrong
                </h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Solution:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Check if your device's location services are enabled</li>
                    <li>Make sure you're not using a VPN that changes your location</li>
                    <li>Try selecting your location manually on the map</li>
                    <li>Restart your browser and try again</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tips for better accuracy */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <h3 className="font-semibold text-blue-900 mb-2">💡 Tips for Better Accuracy</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• Use your device outdoors or near windows</p>
                <p>• Wait for GPS to fully lock (usually 10-30 seconds)</p>
                <p>• Keep your device steady while getting location</p>
                <p>• Use WiFi when possible for better accuracy</p>
                <p>• Make sure your device's time is set correctly</p>
              </div>
            </CardContent>
          </Card>

          {/* Alternative methods */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <h3 className="font-semibold text-green-900 mb-2">🗺️ Alternative Methods</h3>
              <div className="text-sm text-green-800 space-y-1">
                <p>If automatic location doesn't work well:</p>
                <p>• Use "Choose on Map" to select your location manually</p>
                <p>• Type your address in the address field</p>
                <p>• Use landmarks or nearby businesses as reference points</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={onClose} className="bg-italian-green-600 hover:bg-italian-green-700">
              Got it!
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LocationHelpModal;
