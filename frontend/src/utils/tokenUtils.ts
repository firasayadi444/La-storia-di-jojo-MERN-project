// tokenUtils.ts

import { jwtDecode } from 'jwt-decode';

export interface DecodedToken {
  exp: number;              // Expiration time (UNIX timestamp)
  iat: number;              // Issued at time (optional)
  user_id: string;          // Custom claim (adapt to your backend: user_id, sub, etc.)
  role?: string;            // Optional role
  [key: string]: string | number | boolean; // Allow additional dynamic claims
}

/**
 * Decode a JWT token.
 */
export function decodeToken(token: string): DecodedToken {
  return jwtDecode<DecodedToken>(token);
}

/**
 * Check if a JWT token is expired.
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true; // If token is invalid or malformed
  }
}

/**
 * Get expiration time from a JWT token as a Date.
 */
export function getTokenExpirationTime(token: string): Date | null {
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    return new Date(decoded.exp * 1000);
  } catch (error) {
    return null;
  }
}

/**
 * Get remaining time before expiration in seconds.
 */
export function getTokenRemainingTime(token: string): number | null {
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp - currentTime;
  } catch (error) {
    return null;
  }
}

/**
 * Remove token from localStorage (or sessionStorage if you're using it).
 */
export function clearAuthData(): void {
  localStorage.removeItem('token');
}

/**
 * Log out user by clearing auth data and redirecting to login.
 */
export function logoutUser(): void {
  clearAuthData();
  window.location.href = '/login'; // or use your router's navigation method
}

/**
 * Automatically log out if token is expired or nearly expired.
 */
export function validateAndRefreshToken(token?: string): boolean {
  const tokenToCheck = token || localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!tokenToCheck) {
    return false;
  }
  
  const remaining = getTokenRemainingTime(tokenToCheck);
  if (remaining !== null && remaining < 60) {
    console.warn("Token is about to expire, logging out.");
    logoutUser();
    return false;
  }
  return true;
}
