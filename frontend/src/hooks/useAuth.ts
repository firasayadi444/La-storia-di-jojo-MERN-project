import { useEffect, useRef } from 'react';
import { validateAndRefreshToken, logoutUser } from '../utils/tokenUtils';

export const useAuth = () => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check token on mount
    validateAndRefreshToken();

    // Set up periodic token validation (every 30 seconds)
    intervalRef.current = setInterval(() => {
      const isValid = validateAndRefreshToken();
      if (!isValid) {
        // Token is invalid, logout will be handled by validateAndRefreshToken
        return;
      }
    }, 30000); // 30 seconds

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const logout = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    logoutUser();
  };

  return { logout };
}; 