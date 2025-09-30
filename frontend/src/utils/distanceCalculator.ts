/**
 * Calculate the distance between two points using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Format distance for display
 * @param distance Distance in kilometers
 * @returns Formatted distance string
 */
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m away`;
  }
  return `${distance.toFixed(1)}km away`;
}

/**
 * Calculate estimated time of arrival based on distance
 * @param distance Distance in kilometers
 * @param averageSpeed Average speed in km/h (default: 20 km/h for delivery)
 * @returns ETA in minutes
 */
export function calculateETA(distance: number, averageSpeed: number = 20): number {
  return Math.round((distance / averageSpeed) * 60);
}

/**
 * Format time for display
 * @param minutes Time in minutes
 * @returns Formatted time string
 */
export function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `Arriving in ${minutes} mins`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `Arriving in ${hours}h ${remainingMinutes}m`;
}
