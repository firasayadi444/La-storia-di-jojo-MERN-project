import { useEffect, useRef } from 'react';
import { validateAndRefreshToken, logoutUser } from '../utils/tokenUtils';

export const useAuth = () => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check token on mount
    validateAndRefreshToken();

    // Set up periodic token validation (every 5 minutes)
    intervalRef.current = setInterval(() => {
      const isValid = validateAndRefreshToken();
      if (!isValid) {
        // Token is invalid, logout will be handled by validateAndRefreshToken
        return;
      }
    }, 300000); // 5 minutes (300000ms)

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