/**
 * Optimized Route Service for Real-time Tracking
 * Enhanced OpenRouteService integration with debouncing and distance thresholds
 */

import { getSmartRoute, getFallbackRoute, RouteResult } from './openRouteService';

export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface OptimizedRouteOptions {
  debounceMs?: number;
  distanceThresholdMeters?: number;
  maxRetries?: number;
  cacheTimeoutMs?: number;
}

interface RouteCache {
  route: RouteResult;
  timestamp: number;
  startPoint: RoutePoint;
  endPoint: RoutePoint;
}

interface PendingRequest {
  resolve: (route: RouteResult) => void;
  reject: (error: Error) => void;
}

class OptimizedRouteService {
  private cache: Map<string, RouteCache> = new Map();
  private pendingRequests: Map<string, PendingRequest[]> = new Map();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  
  private readonly defaultOptions: Required<OptimizedRouteOptions> = {
    debounceMs: 2000, // 2 seconds debounce
    distanceThresholdMeters: 50, // 50 meters threshold
    maxRetries: 3,
    cacheTimeoutMs: 300000 // 5 minutes cache
  };

  /**
   * Get route with optimization (debouncing, caching, distance threshold)
   */
  async getOptimizedRoute(
    start: RoutePoint,
    end: RoutePoint,
    context: 'delivery' | 'customer' = 'delivery',
    options: OptimizedRouteOptions = {}
  ): Promise<RouteResult> {
    const opts = { ...this.defaultOptions, ...options };
    const cacheKey = this.generateCacheKey(start, end, context);
    
    // Check cache first
    const cached = this.getCachedRoute(cacheKey, start, end, opts.distanceThresholdMeters);
    if (cached) {
      return cached;
    }

    // Check if there's already a pending request for this route
    if (this.pendingRequests.has(cacheKey)) {
      return new Promise((resolve, reject) => {
        this.pendingRequests.get(cacheKey)!.push({ resolve, reject });
      });
    }

    // Debounce the request
    return this.debouncedRouteRequest(cacheKey, start, end, context, opts);
  }

  /**
   * Debounced route request to prevent excessive API calls
   */
  private async debouncedRouteRequest(
    cacheKey: string,
    start: RoutePoint,
    end: RoutePoint,
    context: 'delivery' | 'customer',
    options: Required<OptimizedRouteOptions>
  ): Promise<RouteResult> {
    return new Promise((resolve, reject) => {
      // Clear existing timer
      if (this.debounceTimers.has(cacheKey)) {
        clearTimeout(this.debounceTimers.get(cacheKey)!);
      }

      // Set new timer
      const timer = setTimeout(async () => {
        try {
          const route = await this.fetchRouteWithRetry(start, end, context, options.maxRetries);
          this.cacheRoute(cacheKey, route, start, end);
          
          // Resolve all pending requests
          const pending = this.pendingRequests.get(cacheKey) || [];
          pending.forEach(p => p.resolve(route));
          this.pendingRequests.delete(cacheKey);
          
          resolve(route);
        } catch (error) {
          // Reject all pending requests
          const pending = this.pendingRequests.get(cacheKey) || [];
          pending.forEach(p => p.reject(error as Error));
          this.pendingRequests.delete(cacheKey);
          
          reject(error);
        }
        
        this.debounceTimers.delete(cacheKey);
      }, options.debounceMs);

      this.debounceTimers.set(cacheKey, timer);
      
      // Store pending request
      if (!this.pendingRequests.has(cacheKey)) {
        this.pendingRequests.set(cacheKey, []);
      }
      this.pendingRequests.get(cacheKey)!.push({ resolve, reject });
    });
  }

  /**
   * Fetch route with retry logic
   */
  private async fetchRouteWithRetry(
    start: RoutePoint,
    end: RoutePoint,
    context: 'delivery' | 'customer',
    maxRetries: number
  ): Promise<RouteResult> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const route = await getSmartRoute(start, end, context);
        
        if (route) {
          return route;
        }
        
        throw new Error('Route service returned null');
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // All retries failed, use fallback
    const fallback = getFallbackRoute(start, end);
    this.cacheRoute(this.generateCacheKey(start, end, context), fallback, start, end);
    return fallback;
  }

  /**
   * Generate cache key for route
   */
  private generateCacheKey(start: RoutePoint, end: RoutePoint, context: string): string {
    return `${start.lat.toFixed(4)},${start.lng.toFixed(4)}-${end.lat.toFixed(4)},${end.lng.toFixed(4)}-${context}`;
  }

  /**
   * Get cached route if it's still valid
   */
  private getCachedRoute(
    cacheKey: string,
    start: RoutePoint,
    end: RoutePoint,
    distanceThreshold: number
  ): RouteResult | null {
    const cached = this.cache.get(cacheKey);
    if (!cached) return null;

    // Check if cache is expired
    const now = Date.now();
    if (now - cached.timestamp > this.defaultOptions.cacheTimeoutMs) {
      this.cache.delete(cacheKey);
      return null;
    }

    // Check if positions have changed significantly
    const startDistance = this.calculateDistance(cached.startPoint, start);
    const endDistance = this.calculateDistance(cached.endPoint, end);
    
    if (startDistance > distanceThreshold || endDistance > distanceThreshold) {
      this.cache.delete(cacheKey);
      return null;
    }

    return cached.route;
  }

  /**
   * Cache route result
   */
  private cacheRoute(cacheKey: string, route: RouteResult, start: RoutePoint, end: RoutePoint): void {
    this.cache.set(cacheKey, {
      route,
      timestamp: Date.now(),
      startPoint: start,
      endPoint: end
    });
    
    // Clean up old cache entries
    this.cleanupCache();
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.defaultOptions.cacheTimeoutMs) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.cache.delete(key));
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(point1: RoutePoint, point2: RoutePoint): number {
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
   * Clear all cache and pending requests
   */
  clearCache(): void {
    this.cache.clear();
    this.pendingRequests.clear();
    
    // Clear all debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const optimizedRouteService = new OptimizedRouteService();

/**
 * Convenience function for getting optimized route
 */
export async function getOptimizedRoute(
  start: RoutePoint,
  end: RoutePoint,
  context: 'delivery' | 'customer' = 'delivery',
  options?: OptimizedRouteOptions
): Promise<RouteResult> {
  return optimizedRouteService.getOptimizedRoute(start, end, context, options);
}

/**
 * Clear route cache (useful for testing or manual refresh)
 */
export function clearRouteCache(): void {
  optimizedRouteService.clearCache();
}

/**
 * Get cache statistics (useful for debugging)
 */
export function getRouteCacheStats(): { size: number; keys: string[] } {
  return optimizedRouteService.getCacheStats();
}
