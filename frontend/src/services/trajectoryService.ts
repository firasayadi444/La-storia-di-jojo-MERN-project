/**
 * Service for managing delivery person trajectory history
 */

export interface TrajectoryPoint {
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

export interface TrajectoryData {
  orderId: string;
  deliveryManId: string;
  points: TrajectoryPoint[];
  lastUpdated: string;
}

class TrajectoryService {
  private trajectories: Map<string, TrajectoryData> = new Map();
  private readonly MAX_POINTS = 100; // Maximum number of points to keep in memory
  private readonly MIN_DISTANCE = 10; // Minimum distance in meters between points

  /**
   * Add a new point to the trajectory
   */
  addPoint(orderId: string, deliveryManId: string, point: TrajectoryPoint): void {
    const key = `${orderId}-${deliveryManId}`;
    let trajectory = this.trajectories.get(key);

    if (!trajectory) {
      trajectory = {
        orderId,
        deliveryManId,
        points: [],
        lastUpdated: new Date().toISOString()
      };
      this.trajectories.set(key, trajectory);
    }

    // Check if we should add this point (minimum distance check)
    if (trajectory.points.length > 0) {
      const lastPoint = trajectory.points[trajectory.points.length - 1];
      const distance = this.calculateDistance(
        lastPoint.latitude,
        lastPoint.longitude,
        point.latitude,
        point.longitude
      );

      // Skip if too close to the last point
      if (distance < this.MIN_DISTANCE) {
        return;
      }
    }

    // Add the new point
    trajectory.points.push(point);
    trajectory.lastUpdated = new Date().toISOString();

    // Keep only the most recent points
    if (trajectory.points.length > this.MAX_POINTS) {
      trajectory.points = trajectory.points.slice(-this.MAX_POINTS);
    }

    console.log(`📍 Trajectory updated for order ${orderId}: ${trajectory.points.length} points`);
  }

  /**
   * Get trajectory for a specific order and delivery person
   */
  getTrajectory(orderId: string, deliveryManId: string): TrajectoryPoint[] {
    const key = `${orderId}-${deliveryManId}`;
    const trajectory = this.trajectories.get(key);
    return trajectory ? trajectory.points : [];
  }

  /**
   * Get all trajectories for an order (in case delivery person changes)
   */
  getOrderTrajectories(orderId: string): TrajectoryPoint[] {
    const allPoints: TrajectoryPoint[] = [];
    
    for (const [key, trajectory] of this.trajectories.entries()) {
      if (trajectory.orderId === orderId) {
        allPoints.push(...trajectory.points);
      }
    }

    // Sort by timestamp
    return allPoints.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  /**
   * Clear trajectory for a specific order
   */
  clearTrajectory(orderId: string, deliveryManId?: string): void {
    if (deliveryManId) {
      const key = `${orderId}-${deliveryManId}`;
      this.trajectories.delete(key);
    } else {
      // Clear all trajectories for this order
      for (const [key, trajectory] of this.trajectories.entries()) {
        if (trajectory.orderId === orderId) {
          this.trajectories.delete(key);
        }
      }
    }
  }

  /**
   * Get trajectory statistics
   */
  getTrajectoryStats(orderId: string, deliveryManId: string): {
    totalDistance: number;
    totalTime: number;
    averageSpeed: number;
    pointCount: number;
  } {
    const points = this.getTrajectory(orderId, deliveryManId);
    
    if (points.length < 2) {
      return {
        totalDistance: 0,
        totalTime: 0,
        averageSpeed: 0,
        pointCount: points.length
      };
    }

    let totalDistance = 0;
    const startTime = new Date(points[0].timestamp).getTime();
    const endTime = new Date(points[points.length - 1].timestamp).getTime();
    const totalTime = (endTime - startTime) / 1000; // in seconds

    for (let i = 1; i < points.length; i++) {
      const distance = this.calculateDistance(
        points[i - 1].latitude,
        points[i - 1].longitude,
        points[i].latitude,
        points[i].longitude
      );
      totalDistance += distance;
    }

    const averageSpeed = totalTime > 0 ? (totalDistance / totalTime) * 3.6 : 0; // km/h

    return {
      totalDistance,
      totalTime,
      averageSpeed,
      pointCount: points.length
    };
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  /**
   * Export trajectory data for debugging
   */
  exportTrajectory(orderId: string, deliveryManId: string): string {
    const trajectory = this.getTrajectory(orderId, deliveryManId);
    return JSON.stringify(trajectory, null, 2);
  }

  /**
   * Clear all trajectories (for cleanup)
   */
  clearAll(): void {
    this.trajectories.clear();
  }
}

// Export singleton instance
export const trajectoryService = new TrajectoryService();
