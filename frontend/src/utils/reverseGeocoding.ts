/**
 * Reverse geocoding service using Nominatim API
 */

export interface GeocodingResult {
  address: string;
  accuracy: number;
  error?: string;
}

/**
 * Get address from coordinates using Nominatim API
 * @param latitude Latitude coordinate
 * @param longitude Longitude coordinate
 * @returns Promise with address information
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'OrderApp/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    // Extract address components
    const address = data.display_name || 'Unknown location';
    const accuracy = data.address?.house_number ? 10 : 
                    data.address?.street ? 50 : 
                    data.address?.suburb ? 100 : 
                    data.address?.city ? 500 : 1000;

    return {
      address,
      accuracy
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return {
      address: `Location (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`,
      accuracy: 1000,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get current location using browser geolocation API
 * @returns Promise with location data
 */
export async function getCurrentLocation(): Promise<{latitude: number, longitude: number, accuracy: number}> {
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
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        let errorMessage = 'Unknown error occurred';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
}
