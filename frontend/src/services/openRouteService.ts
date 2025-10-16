/**
 * OpenRouteService API Integration
 * Provides real road routing using OpenRouteService API
 */

export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface RouteResult {
  coordinates: [number, number][];
  distance: number; // in meters
  duration: number; // in seconds
}

export interface ORSResponse {
  features: Array<{
    properties: {
      summary: {
        distance: number;
        duration: number;
      };
    };
    geometry: {
      coordinates: number[][];
    };
  }>;
}

/**
 * Get route from OpenRouteService API
 */
export async function getORSRoute(
  start: RoutePoint,
  end: RoutePoint,
  profile: 'driving-car' | 'driving-hgv' | 'cycling-regular' | 'cycling-road' | 'foot-walking' = 'driving-car'
): Promise<RouteResult | null> {
  const apiKey = import.meta.env.VITE_ORS_API_KEY;
  
  if (!apiKey) {
    console.warn('❌ VITE_ORS_API_KEY not found in environment variables');
    return null;
  }

  // Validate coordinates
  if (!isValidCoordinate(start.lat, start.lng) || !isValidCoordinate(end.lat, end.lng)) {
    console.warn('❌ Invalid coordinates for ORS routing:', { start, end });
    return null;
  }

  // Additional validation for coordinate range
  if (start.lat < -90 || start.lat > 90 || end.lat < -90 || end.lat > 90 ||
      start.lng < -180 || start.lng > 180 || end.lng < -180 || end.lng > 180) {
    console.warn('❌ Coordinates out of valid range:', { start, end });
    return null;
  }


  try {
    const url = `https://api.openrouteservice.org/v2/directions/${profile}/geojson?api_key=${encodeURIComponent(apiKey)}`;
    
    const requestBody = {
      coordinates: [[start.lng, start.lat], [end.lng, end.lat]],
      format: 'geojson',
      preference: 'fastest',
      units: 'm'
    };


    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ ORS API error:', response.status, errorText);
      return null;
    }

    const data: ORSResponse = await response.json();

    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      const coordinates: [number, number][] = feature.geometry.coordinates.map(
        (coord: number[]) => [coord[1], coord[0]] as [number, number]
      ); // Convert [lng, lat] to [lat, lng]

      const result = {
        coordinates,
        distance: feature.properties.summary.distance,
        duration: feature.properties.summary.duration
      };


      return result;
    }

    return null;
  } catch (error) {
    console.warn('❌ ORS routing error:', error);
    return null;
  }
}

/**
 * Get route with automatic profile selection based on context
 */
export async function getSmartRoute(
  start: RoutePoint,
  end: RoutePoint,
  context: 'delivery' | 'customer' = 'delivery'
): Promise<RouteResult | null> {
  // Select appropriate profile based on context
  const profile = context === 'delivery' ? 'driving-car' : 'driving-car';
  
  return getORSRoute(start, end, profile);
}

/**
 * Validate coordinate values
 */
function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    isFinite(lat) &&
    isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Get fallback route when ORS is unavailable
 */
export function getFallbackRoute(
  start: RoutePoint,
  end: RoutePoint
): RouteResult {
  console.log('⚠️ Using fallback route (straight line)');
  
  const distance = calculateHaversineDistance(start, end);
  const averageSpeed = 25; // km/h
  const duration = (distance / 1000) / averageSpeed * 3600; // Convert to seconds

  return {
    coordinates: [
      [start.lat, start.lng],
      [end.lat, end.lng]
    ],
    distance,
    duration
  };
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateHaversineDistance(point1: RoutePoint, point2: RoutePoint): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLng = (point2.lng - point1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Interpolate points along a route for smooth marker animation
 */
export function interpolateRoute(
  coordinates: [number, number][],
  numPoints: number = 50
): [number, number][] {
  if (coordinates.length < 2) return coordinates;
  
  const interpolated: [number, number][] = [];
  
  for (let i = 0; i < coordinates.length - 1; i++) {
    const start = coordinates[i];
    const end = coordinates[i + 1];
    
    // Add the starting point
    if (i === 0) {
      interpolated.push(start);
    }
    
    // Interpolate between start and end
    const segmentPoints = Math.ceil(numPoints / (coordinates.length - 1));
    for (let j = 1; j < segmentPoints; j++) {
      const ratio = j / segmentPoints;
      const lat = start[0] + (end[0] - start[0]) * ratio;
      const lng = start[1] + (end[1] - start[1]) * ratio;
      interpolated.push([lat, lng]);
    }
    
    // Add the ending point for the last segment
    if (i === coordinates.length - 2) {
      interpolated.push(end);
    }
  }
  
  return interpolated;
}
