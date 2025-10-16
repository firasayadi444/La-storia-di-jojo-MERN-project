/**
 * Shared Tracking Utilities
 * Common functions used by both DeliveryTracking and TrackOrder components
 */

import { calculateDistance, formatDistance, calculateETA, formatTime } from './distanceCalculator';
import { RouteResult } from '@/services/openRouteService';

// Restaurant location (fixed)
export const RESTAURANT_LOCATION: [number, number] = [36.90272039645084, 10.187488663609964];

// Fix for default markers in react-leaflet
export const fixLeafletMarkers = () => {
  if (typeof window !== 'undefined') {
    const L = require('leaflet');
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });
  }
};

// Custom marker icons
export const createMarkerIcons = () => {
  if (typeof window === 'undefined') return {};
  
  const L = require('leaflet');
  return {
    restaurantIcon: new L.Icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    }),
    customerIcon: new L.Icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    }),
    deliveryIcon: new L.Icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    })
  };
};

// Calculate distance and ETA
export const updateCalculations = (
  fromLocation: { latitude: number; longitude: number },
  toLocation: { latitude: number; longitude: number }
) => {
  const dist = calculateDistance(
    fromLocation.latitude,
    fromLocation.longitude,
    toLocation.latitude,
    toLocation.longitude
  );
  const eta = calculateETA(dist);
  return { distance: dist, eta };
};

// Get status badge color
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'confirmed':
      return 'bg-blue-100 text-blue-800';
    case 'preparing':
      return 'bg-orange-100 text-orange-800';
    case 'ready':
      return 'bg-purple-100 text-purple-800';
    case 'out_for_delivery':
      return 'bg-indigo-100 text-indigo-800';
    case 'delivered':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Format estimated delivery time
export const formatEstimatedTime = (timeString: string): string => {
  const time = new Date(timeString);
  return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Get route polyline positions with fallback
export const getRoutePositions = (
  routeData: RouteResult | null,
  fallbackPositions: [number, number][]
): [number, number][] => {
  console.log('🔍 getRoutePositions called:', {
    hasRouteData: !!routeData,
    routeDataLength: routeData?.coordinates?.length || 0,
    fallbackLength: fallbackPositions.length
  });
  
  // Use real route data if available, otherwise fallback to provided positions
  if (routeData && routeData.coordinates && routeData.coordinates.length > 0) {
    console.log('✅ Using real route data with', routeData.coordinates.length, 'coordinates');
    return routeData.coordinates;
  }
  
  console.log('⚠️ Using fallback positions:', fallbackPositions);
  return fallbackPositions;
};

// Get all positions for map bounds
export const getAllPositions = (
  restaurantLocation: [number, number],
  customerLocation: [number, number] | null,
  deliveryLocation: { latitude: number; longitude: number } | null
): [number, number][] => {
  const positions: [number, number][] = [restaurantLocation];
  
  if (customerLocation) {
    positions.push(customerLocation);
  }
  
  if (deliveryLocation) {
    positions.push([deliveryLocation.latitude, deliveryLocation.longitude]);
  }
  
  return positions;
};

// MapBounds component
export const MapBounds: React.FC<{ positions: [number, number][] }> = ({ positions }) => {
  const map = useMap();

  useEffect(() => {
    if (positions.length > 0) {
      const group = new (require('leaflet')).LatLngBounds(positions);
      map.fitBounds(group, { padding: [20, 20] });
    }
  }, [map, positions]);

  return null;
};

// Export common types
export interface TrackingState {
  distance: number;
  eta: number;
  lastUpdate: Date | null;
  isLoading: boolean;
  error: string;
}

export interface RouteState {
  routeData: RouteResult | null;
  isLoadingRoute: boolean;
  routeStats: { distance: number; duration: number; isRealRoute: boolean } | null;
}
