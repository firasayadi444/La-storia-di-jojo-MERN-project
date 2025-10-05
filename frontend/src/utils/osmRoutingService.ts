import L from 'leaflet';

export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface RouteResult {
  coordinates: [number, number][];
  distance: number;
  duration: number;
}

/**
 * Get route from OSM routing service (OSRM)
 * This uses the free OSRM service with OSM data
 */
export async function getOSMRoute(
  start: RoutePoint,
  end: RoutePoint,
  profile: 'driving' | 'cycling' | 'walking' = 'driving'
): Promise<RouteResult | null> {
  try {
    // Validate coordinates
    if (!isValidCoordinate(start.lat, start.lng) || !isValidCoordinate(end.lat, end.lng)) {
      console.warn('Invalid coordinates for OSM routing:', { start, end });
      return null;
    }

    const profileMap = {
      driving: 'driving',
      cycling: 'cycling',
      walking: 'foot'
    };

    const url = `https://router.project-osrm.org/route/v1/${profileMap[profile]}/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
    
    console.log('🗺️ Fetching OSM route from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      console.warn('OSRM API error:', response.status, response.statusText);
      return null;
    }
    
    const data = await response.json();
    
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const coordinates: [number, number][] = route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]] as [number, number]);
      
      return {
        coordinates,
        distance: route.distance,
        duration: route.duration
      };
    }
    
    return null;
  } catch (error) {
    console.warn('OSM routing error:', error);
    return null;
  }
}

/**
 * Create a polyline from route coordinates
 */
export function createRoutePolyline(
  coordinates: [number, number][],
  color: string = '#3b82f6',
  weight: number = 4,
  opacity: number = 0.8
): L.Polyline {
  return L.polyline(coordinates, {
    color,
    weight,
    opacity,
    smoothFactor: 1
  });
}


/**
 * Validate coordinates are reasonable
 */
function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180 &&
    !(lat === 0 && lng === 0) && // Not the default 0,0
    !isNaN(lat) && !isNaN(lng) &&
    isFinite(lat) && isFinite(lng)
  );
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  } else {
    return `${(meters / 1000).toFixed(1)}km`;
  }
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
}
