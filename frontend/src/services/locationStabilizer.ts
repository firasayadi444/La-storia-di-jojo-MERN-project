/**
 * Location Stabilization Service
 * Improves GPS accuracy by snapping to roads and applying smoothing techniques
 */

import { getOptimizedRoute, RoutePoint } from './optimizedRouteService';

export interface StabilizedLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  isSnappedToRoad: boolean;
  originalLocation?: {
    latitude: number;
    longitude: number;
  };
}

export interface LocationStabilizerOptions {
  snapToRoad?: boolean;
  movingAverageWindow?: number;
  noiseThresholdMeters?: number;
  maxSnapDistanceMeters?: number;
}

export interface ORSSnapResponse {
  features: Array<{
    geometry: {
      coordinates: number[];
    };
    properties: {
      waypoint_index?: number;
    };
  }>;
}

class LocationStabilizer {
  private locationHistory: StabilizedLocation[] = [];
  private readonly defaultOptions: Required<LocationStabilizerOptions> = {
    snapToRoad: true,
    movingAverageWindow: 5,
    noiseThresholdMeters: 10,
    maxSnapDistanceMeters: 100
  };

  /**
   * Stabilize a GPS location using road snapping and smoothing
   */
  async stabilizeLocation(
    rawLocation: { latitude: number; longitude: number; accuracy?: number },
    options: LocationStabilizerOptions = {}
  ): Promise<StabilizedLocation> {
    const opts = { ...this.defaultOptions, ...options };
    const timestamp = Date.now();

    // Step 1: Snap to road if enabled
    let snappedLocation = rawLocation;
    let isSnappedToRoad = false;

    if (opts.snapToRoad) {
      try {
        const roadSnapped = await this.snapToRoad(rawLocation, opts.maxSnapDistanceMeters);
        if (roadSnapped) {
          snappedLocation = roadSnapped;
          isSnappedToRoad = true;
          console.log('🛣️ Location snapped to road:', {
            original: { lat: rawLocation.latitude, lng: rawLocation.longitude },
            snapped: { lat: snappedLocation.latitude, lng: snappedLocation.longitude }
          });
        }
      } catch (error) {
        console.warn('⚠️ Road snapping failed, using raw location:', error);
      }
    }

    // Step 2: Apply moving average smoothing
    const smoothedLocation = this.applyMovingAverage(snappedLocation, opts.movingAverageWindow);

    // Step 3: Check noise threshold
    const finalLocation = this.filterNoise(smoothedLocation, opts.noiseThresholdMeters);

    // Create stabilized location object
    const stabilizedLocation: StabilizedLocation = {
      latitude: finalLocation.latitude,
      longitude: finalLocation.longitude,
      accuracy: rawLocation.accuracy || 0,
      timestamp,
      isSnappedToRoad,
      originalLocation: rawLocation
    };

    // Add to history
    this.addToHistory(stabilizedLocation);

    console.log('📍 Location stabilized:', {
      original: { lat: rawLocation.latitude, lng: rawLocation.longitude },
      stabilized: { lat: stabilizedLocation.latitude, lng: stabilizedLocation.longitude },
      isSnappedToRoad,
      historySize: this.locationHistory.length
    });

    return stabilizedLocation;
  }

  /**
   * Snap GPS location to nearest road using OpenRouteService
   */
  private async snapToRoad(
    location: { latitude: number; longitude: number },
    maxDistanceMeters: number
  ): Promise<{ latitude: number; longitude: number } | null> {
    const apiKey = import.meta.env.VITE_ORS_API_KEY;
    
    if (!apiKey) {
      console.warn('❌ VITE_ORS_API_KEY not found for road snapping');
      return null;
    }

    try {
      const url = `https://api.openrouteservice.org/v2/snap/driving-car`;
      
      const requestBody = {
        coordinates: [[location.longitude, location.latitude]], // Note: ORS uses [lng, lat]
        radius: maxDistanceMeters
      };

      console.log('🛣️ Snapping location to road...', requestBody);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': apiKey
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn('❌ ORS snap API error:', response.status, response.statusText, errorText);
        return null;
      }

      const data: ORSSnapResponse = await response.json();

      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const coordinates = feature.geometry.coordinates;
        
        // Convert back to [lat, lng] format
        const snappedLocation = {
          latitude: coordinates[1],
          longitude: coordinates[0]
        };

        // Verify the snapped location is within reasonable distance
        const distance = this.calculateDistance(location, snappedLocation);
        if (distance <= maxDistanceMeters) {
          return snappedLocation;
        } else {
          console.warn(`⚠️ Snapped location too far (${distance.toFixed(1)}m), using original`);
          return null;
        }
      }

      return null;
    } catch (error) {
      console.warn('❌ Road snapping error:', error);
      return null;
    }
  }

  /**
   * Apply moving average smoothing to reduce GPS noise
   */
  private applyMovingAverage(
    location: { latitude: number; longitude: number },
    windowSize: number
  ): { latitude: number; longitude: number } {
    if (this.locationHistory.length === 0) {
      return location;
    }

    // Get recent locations for averaging
    const recentLocations = this.locationHistory.slice(-windowSize);
    const locationsToAverage = [...recentLocations, { latitude: location.latitude, longitude: location.longitude }];

    // Calculate weighted average (more recent locations have higher weight)
    let totalWeight = 0;
    let weightedLat = 0;
    let weightedLng = 0;

    locationsToAverage.forEach((loc, index) => {
      const weight = index + 1; // More recent = higher weight
      weightedLat += loc.latitude * weight;
      weightedLng += loc.longitude * weight;
      totalWeight += weight;
    });

    return {
      latitude: weightedLat / totalWeight,
      longitude: weightedLng / totalWeight
    };
  }

  /**
   * Filter out small position changes (noise)
   */
  private filterNoise(
    location: { latitude: number; longitude: number },
    thresholdMeters: number
  ): { latitude: number; longitude: number } {
    if (this.locationHistory.length === 0) {
      return location;
    }

    const lastLocation = this.locationHistory[this.locationHistory.length - 1];
    const distance = this.calculateDistance(lastLocation, location);

    if (distance < thresholdMeters) {
      console.log(`🔇 Filtering noise: ${distance.toFixed(1)}m < ${thresholdMeters}m threshold`);
      return {
        latitude: lastLocation.latitude,
        longitude: lastLocation.longitude
      };
    }

    return location;
  }

  /**
   * Add location to history (with size limit)
   */
  private addToHistory(location: StabilizedLocation): void {
    this.locationHistory.push(location);
    
    // Keep only recent history (last 20 locations)
    const maxHistorySize = 20;
    if (this.locationHistory.length > maxHistorySize) {
      this.locationHistory = this.locationHistory.slice(-maxHistorySize);
    }
  }

  /**
   * Calculate distance between two points in meters
   */
  private calculateDistance(
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number }
  ): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
    const dLng = (point2.longitude - point1.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Get stabilization statistics
   */
  getStats(): {
    historySize: number;
    recentSnappedCount: number;
    averageAccuracy: number;
  } {
    const recentLocations = this.locationHistory.slice(-10);
    const snappedCount = recentLocations.filter(loc => loc.isSnappedToRoad).length;
    const averageAccuracy = recentLocations.length > 0 
      ? recentLocations.reduce((sum, loc) => sum + loc.accuracy, 0) / recentLocations.length
      : 0;

    return {
      historySize: this.locationHistory.length,
      recentSnappedCount: snappedCount,
      averageAccuracy
    };
  }

  /**
   * Clear location history
   */
  clearHistory(): void {
    this.locationHistory = [];
    console.log('🧹 Location history cleared');
  }

  /**
   * Get smoothed movement direction
   */
  getMovementDirection(): { bearing: number; speed: number } | null {
    if (this.locationHistory.length < 2) {
      return null;
    }

    const recent = this.locationHistory.slice(-3); // Last 3 locations
    const oldest = recent[0];
    const newest = recent[recent.length - 1];

    const distance = this.calculateDistance(oldest, newest);
    const timeDiff = (newest.timestamp - oldest.timestamp) / 1000; // seconds
    const speed = timeDiff > 0 ? distance / timeDiff : 0; // m/s

    // Calculate bearing
    const dLng = (newest.longitude - oldest.longitude) * Math.PI / 180;
    const lat1 = oldest.latitude * Math.PI / 180;
    const lat2 = newest.latitude * Math.PI / 180;
    
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    
    const bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;

    return { bearing, speed };
  }
}

// Export singleton instance
export const locationStabilizer = new LocationStabilizer();

/**
 * Convenience function for stabilizing location
 */
export async function stabilizeLocation(
  rawLocation: { latitude: number; longitude: number; accuracy?: number },
  options?: LocationStabilizerOptions
): Promise<StabilizedLocation> {
  return locationStabilizer.stabilizeLocation(rawLocation, options);
}

/**
 * Get stabilization statistics
 */
export function getStabilizationStats(): {
  historySize: number;
  recentSnappedCount: number;
  averageAccuracy: number;
} {
  return locationStabilizer.getStats();
}

/**
 * Clear location history
 */
export function clearLocationHistory(): void {
  locationStabilizer.clearHistory();
}
