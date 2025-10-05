/**
 * Navigation utilities for Google Maps integration
 */

export interface Location {
  latitude: number;
  longitude: number;
}

/**
 * Generate Google Maps navigation URL
 * @param destination - The destination coordinates
 * @param origin - Optional origin coordinates (if not provided, uses current location)
 * @returns Google Maps URL for navigation
 */
export const generateGoogleMapsUrl = (destination: Location, origin?: Location): string => {
  const baseUrl = 'https://www.google.com/maps/dir/?api=1';
  const destinationParam = `&destination=${destination.latitude},${destination.longitude}`;
  const originParam = origin ? `&origin=${origin.latitude},${origin.longitude}` : '';
  
  return `${baseUrl}${destinationParam}${originParam}`;
};

/**
 * Open Google Maps navigation in a new tab
 * @param destination - The destination coordinates
 * @param origin - Optional origin coordinates
 */
export const openGoogleMapsNavigation = (destination: Location, origin?: Location): void => {
  const url = generateGoogleMapsUrl(destination, origin);
  window.open(url, '_blank');
};

/**
 * Check if the device is mobile
 * @returns true if the device is mobile
 */
export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * Check if Google Maps app is likely installed on mobile
 * @returns true if Google Maps app is likely available
 */
export const hasGoogleMapsApp = (): boolean => {
  if (!isMobileDevice()) return false;
  
  // Check for common mobile platforms that typically have Google Maps
  return /Android|iPhone|iPad/i.test(navigator.userAgent);
};

