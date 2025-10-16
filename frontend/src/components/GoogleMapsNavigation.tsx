import React from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, Navigation, MapPin, Clock, Route } from 'lucide-react';

interface GoogleMapsNavigationProps {
  fromLocation: {
    latitude: number;
    longitude: number;
  };
  toLocation: {
    latitude: number;
    longitude: number;
  };
  fromAddress?: string;
  toAddress?: string;
  className?: string;
}

const GoogleMapsNavigation: React.FC<GoogleMapsNavigationProps> = ({
  fromLocation,
  toLocation,
  fromAddress,
  toAddress,
  className = ''
}) => {
  // Generate Google Maps URLs for different navigation options
  const generateGoogleMapsUrl = (mode: 'driving' | 'walking' | 'transit' = 'driving') => {
    const from = `${fromLocation.latitude},${fromLocation.longitude}`;
    const to = `${toLocation.latitude},${toLocation.longitude}`;
    
    // Use Google Maps URL scheme for better mobile experience
    const baseUrl = 'https://www.google.com/maps/dir/';
    const params = new URLSearchParams({
      api: '1',
      destination: to,
      travelmode: mode
    });
    
    // Add origin if different from current location
    if (fromAddress) {
      params.append('origin', from);
    }
    
    return `${baseUrl}?${params.toString()}`;
  };

  // Generate Google Maps app URL for mobile devices
  const generateGoogleMapsAppUrl = (mode: 'driving' | 'walking' | 'transit' = 'driving') => {
    const from = `${fromLocation.latitude},${fromLocation.longitude}`;
    const to = `${toLocation.latitude},${toLocation.longitude}`;
    
    // Google Maps app URL scheme
    const baseUrl = 'comgooglemaps://';
    const params = new URLSearchParams({
      saddr: from,
      daddr: to,
      directionsmode: mode
    });
    
    return `${baseUrl}?${params.toString()}`;
  };

  // Open navigation with fallback
  const openNavigation = (mode: 'driving' | 'walking' | 'transit' = 'driving') => {
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Try to open Google Maps app first
      const appUrl = generateGoogleMapsAppUrl(mode);
      const webUrl = generateGoogleMapsUrl(mode);
      
      // Create a temporary link to test if the app is installed
      const testLink = document.createElement('a');
      testLink.href = appUrl;
      testLink.style.display = 'none';
      document.body.appendChild(testLink);
      
      // Try to open the app, fallback to web if it fails
      try {
        testLink.click();
        // If app doesn't open within 2 seconds, open web version
        setTimeout(() => {
          window.open(webUrl, '_blank');
        }, 2000);
      } catch (error) {
        // Fallback to web version
        window.open(webUrl, '_blank');
      } finally {
        document.body.removeChild(testLink);
      }
    } else {
      // Desktop: open web version
      window.open(generateGoogleMapsUrl(mode), '_blank');
    }
  };

  // Calculate approximate distance and time
  const calculateDistance = () => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (fromLocation.latitude * Math.PI) / 180;
    const φ2 = (toLocation.latitude * Math.PI) / 180;
    const Δφ = ((toLocation.latitude - fromLocation.latitude) * Math.PI) / 180;
    const Δλ = ((toLocation.longitude - fromLocation.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c; // Distance in meters
    return distance;
  };

  const distance = calculateDistance();
  const estimatedTime = Math.round((distance / 1000) * 2); // Rough estimate: 2 minutes per km

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Route Information */}
      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Route className="h-4 w-4" />
          <span>Route Information</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-gray-500" />
            <span className="text-gray-700">
              {distance < 1000 
                ? `${Math.round(distance)}m` 
                : `${(distance / 1000).toFixed(1)}km`
              }
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-gray-500" />
            <span className="text-gray-700">~{estimatedTime}min</span>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="space-y-2">
        <Button
          onClick={() => openNavigation('driving')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Navigation className="h-4 w-4 mr-2" />
          Open in Google Maps (Driving)
        </Button>
        
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openNavigation('walking')}
            className="text-xs"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Walking
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openNavigation('transit')}
            className="text-xs"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Transit
          </Button>
        </div>
      </div>

      {/* Location Details */}
      {(fromAddress || toAddress) && (
        <div className="text-xs text-gray-500 space-y-1">
          {fromAddress && (
            <div className="flex items-start gap-1">
              <span className="font-medium">From:</span>
              <span className="truncate">{fromAddress}</span>
            </div>
          )}
          {toAddress && (
            <div className="flex items-start gap-1">
              <span className="font-medium">To:</span>
              <span className="truncate">{toAddress}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GoogleMapsNavigation;







