import { apiService } from './api';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: string;
}

export interface LocationUpdateResponse {
  success: boolean;
  message: string;
  location?: LocationData;
}

class LocationService {
  private watchId: number | null = null;
  private isTracking = false;
  private updateInterval: NodeJS.Timeout | null = null;

  /**
   * Get current location using browser geolocation API
   */
  async getCurrentLocation(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          });
        },
        (error) => {
          reject(new Error(`Error getting location: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  }

  /**
   * Update delivery man's location on the server
   */
  async updateLocation(location: LocationData, orderId?: string): Promise<LocationUpdateResponse> {
    try {
      const response = await fetch('/api/deliveryman/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(location)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update location');
      }

      return {
        success: true,
        message: 'Location updated successfully',
        location: data.location
      };
    } catch (error) {
      console.error('Error updating location:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update location'
      };
    }
  }

  /**
   * Start continuous location tracking
   */
  startTracking(onLocationUpdate?: (location: LocationData) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isTracking) {
        resolve();
        return;
      }

      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      this.isTracking = true;

      // Get initial location
      this.getCurrentLocation()
        .then(async (location) => {
          try {
            await this.updateLocation(location);
            onLocationUpdate?.(location);
            resolve();
          } catch (error) {
            console.error('Error updating initial location:', error);
            reject(error);
          }
        })
        .catch(reject);

      // Start watching position
      this.watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const location: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          };

          try {
            await this.updateLocation(location);
            onLocationUpdate?.(location);
          } catch (error) {
            console.error('Error updating location during tracking:', error);
          }
        },
        (error) => {
          console.error('Error tracking location:', error);
          this.stopTracking();
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        }
      );

      // Also update location every 15 seconds as backup for better real-time tracking
      this.updateInterval = setInterval(async () => {
        try {
          const location = await this.getCurrentLocation();
          await this.updateLocation(location);
          onLocationUpdate?.(location);
        } catch (error) {
          console.error('Error in periodic location update:', error);
        }
      }, 15000);
    });
  }

  /**
   * Stop location tracking
   */
  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    this.isTracking = false;
  }

  /**
   * Check if currently tracking
   */
  isCurrentlyTracking(): boolean {
    return this.isTracking;
  }

  /**
   * Calculate distance between two points
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Format distance for display
   */
  formatDistance(distanceInMeters: number): string {
    if (distanceInMeters < 1000) {
      return `${Math.round(distanceInMeters)}m`;
    } else {
      return `${(distanceInMeters / 1000).toFixed(1)}km`;
    }
  }

  /**
   * Calculate ETA based on distance and average speed
   */
  calculateETA(distanceInMeters: number, averageSpeedKmh: number = 15): number {
    const distanceInKm = distanceInMeters / 1000;
    const timeInHours = distanceInKm / averageSpeedKmh;
    return timeInHours * 60; // Return minutes
  }

  /**
   * Format time for display
   */
  formatTime(minutes: number): string {
    if (minutes < 60) {
      return `${Math.round(minutes)}min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = Math.round(minutes % 60);
      return `${hours}h ${remainingMinutes}min`;
    }
  }
}

export const locationService = new LocationService();
