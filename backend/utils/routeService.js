/**
 * Route Service for calculating delivery routes and ETA
 * Supports both OpenRouteService (ORS) and OSRM
 */

const axios = require('axios');

class RouteService {
  constructor() {
    this.orsApiKey = process.env.OPENROUTE_SERVICE_API_KEY;
    this.useORS = !!this.orsApiKey;
    this.osrmBaseUrl = 'https://router.project-osrm.org';
  }

  /**
   * Calculate route between two points using bike profile
   * @param {Object} start - Start coordinates {latitude, longitude}
   * @param {Object} end - End coordinates {latitude, longitude}
   * @returns {Object} Route information with distance, duration, and geometry
   */
  async calculateRoute(start, end) {
    try {
      if (this.useORS) {
        return await this.calculateRouteWithORS(start, end);
      } else {
        return await this.calculateRouteWithOSRM(start, end);
      }
    } catch (error) {
      console.error('Error calculating route:', error);
      throw new Error('Failed to calculate route');
    }
  }

  /**
   * Calculate route using OpenRouteService API
   * @param {Object} start - Start coordinates
   * @param {Object} end - End coordinates
   * @returns {Object} Route information
   */
  async calculateRouteWithORS(start, end) {
    const coordinates = [
      [start.longitude, start.latitude],
      [end.longitude, end.latitude]
    ];

    const response = await axios.post(
      'https://api.openrouteservice.org/v2/directions/cycling-regular',
      {
        coordinates,
        profile: 'cycling-regular',
        format: 'geojson',
        options: {
          avoid_features: ['highways', 'tollways'],
          avoid_borders: 'all'
        }
      },
      {
        headers: {
          'Authorization': this.orsApiKey,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    if (response.data.features && response.data.features.length > 0) {
      const feature = response.data.features[0];
      const properties = feature.properties;
      
      return {
        distance: properties.summary.distance, // in meters
        duration: properties.summary.duration, // in seconds
        geometry: feature.geometry,
        waypoints: coordinates,
        profile: 'cycling-regular'
      };
    }

    throw new Error('No route found');
  }

  /**
   * Calculate route using OSRM API
   * @param {Object} start - Start coordinates
   * @param {Object} end - End coordinates
   * @returns {Object} Route information
   */
  async calculateRouteWithOSRM(start, end) {
    const coordinates = `${start.longitude},${start.latitude};${end.longitude},${end.latitude}`;
    const url = `${this.osrmBaseUrl}/route/v1/bike/${coordinates}?overview=full&geometries=geojson`;

    const response = await axios.get(url, {
      timeout: 10000
    });

    if (response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      
      return {
        distance: route.distance, // in meters
        duration: route.duration, // in seconds
        geometry: route.geometry,
        waypoints: response.data.waypoints.map(wp => [wp.location[0], wp.location[1]]),
        profile: 'bike'
      };
    }

    throw new Error('No route found');
  }

  /**
   * Calculate ETA based on route and current time
   * @param {Object} route - Route information
   * @param {Date} startTime - When delivery started
   * @returns {Object} ETA information
   */
  calculateETA(route, startTime = new Date()) {
    const now = new Date();
    const elapsedMinutes = (now - startTime) / (1000 * 60);
    const remainingDuration = Math.max(0, route.duration - (elapsedMinutes * 60));
    
    const eta = new Date(now.getTime() + (remainingDuration * 1000));
    
    return {
      estimatedArrival: eta,
      remainingMinutes: Math.round(remainingDuration / 60),
      totalDuration: Math.round(route.duration / 60),
      elapsedMinutes: Math.round(elapsedMinutes),
      progress: Math.min(100, (elapsedMinutes * 60) / route.duration * 100)
    };
  }

  /**
   * Get alternative routes (if supported)
   * @param {Object} start - Start coordinates
   * @param {Object} end - End coordinates
   * @param {number} alternatives - Number of alternative routes
   * @returns {Array} Array of route options
   */
  async getAlternativeRoutes(start, end, alternatives = 2) {
    try {
      if (this.useORS) {
        return await this.getAlternativeRoutesWithORS(start, end, alternatives);
      } else {
        // OSRM doesn't support alternatives easily, return single route
        const route = await this.calculateRoute(start, end);
        return [route];
      }
    } catch (error) {
      console.error('Error getting alternative routes:', error);
      return [];
    }
  }

  /**
   * Get alternative routes using OpenRouteService
   */
  async getAlternativeRoutesWithORS(start, end, alternatives) {
    const coordinates = [
      [start.longitude, start.latitude],
      [end.longitude, end.latitude]
    ];

    const response = await axios.post(
      'https://api.openrouteservice.org/v2/directions/cycling-regular',
      {
        coordinates,
        profile: 'cycling-regular',
        format: 'geojson',
        options: {
          avoid_features: ['highways', 'tollways'],
          avoid_borders: 'all'
        },
        alternative_routes: {
          target_count: alternatives,
          weight_factor: 1.4
        }
      },
      {
        headers: {
          'Authorization': this.orsApiKey,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    if (response.data.features && response.data.features.length > 0) {
      return response.data.features.map(feature => {
        const properties = feature.properties;
        return {
          distance: properties.summary.distance,
          duration: properties.summary.duration,
          geometry: feature.geometry,
          waypoints: coordinates,
          profile: 'cycling-regular'
        };
      });
    }

    return [];
  }

  /**
   * Calculate isochrone (reachable area within time limit)
   * @param {Object} center - Center coordinates
   * @param {number} timeLimit - Time limit in minutes
   * @returns {Object} Isochrone geometry
   */
  async calculateIsochrone(center, timeLimit) {
    if (!this.useORS) {
      throw new Error('Isochrone calculation requires OpenRouteService API key');
    }

    try {
      const response = await axios.post(
        'https://api.openrouteservice.org/v2/isochrones/cycling-regular',
        {
          locations: [[center.longitude, center.latitude]],
          profile: 'cycling-regular',
          range: [timeLimit * 60], // Convert to seconds
          range_type: 'time'
        },
        {
          headers: {
            'Authorization': this.orsApiKey,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (response.data.features && response.data.features.length > 0) {
        return response.data.features[0].geometry;
      }

      return null;
    } catch (error) {
      console.error('Error calculating isochrone:', error);
      return null;
    }
  }

  /**
   * Validate coordinates
   * @param {Object} coords - Coordinates to validate
   * @returns {boolean} True if valid
   */
  validateCoordinates(coords) {
    if (!coords || typeof coords.latitude !== 'number' || typeof coords.longitude !== 'number') {
      return false;
    }

    return coords.latitude >= -90 && coords.latitude <= 90 &&
           coords.longitude >= -180 && coords.longitude <= 180;
  }

  /**
   * Get service status
   * @returns {Object} Service status information
   */
  getStatus() {
    return {
      service: this.useORS ? 'OpenRouteService' : 'OSRM',
      hasApiKey: !!this.orsApiKey,
      baseUrl: this.useORS ? 'https://api.openrouteservice.org' : this.osrmBaseUrl,
      profiles: this.useORS ? ['cycling-regular', 'driving-car', 'foot-walking'] : ['bike', 'car', 'foot']
    };
  }
}

module.exports = new RouteService();
