import { calculateDistance, formatDistance, calculateETA, formatTime } from '../distanceCalculator';

describe('Distance Calculator', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two points correctly', () => {
      // Test distance between Tunis, Tunisia and Sfax, Tunisia
      const tunis = { lat: 36.8065, lng: 10.1815 };
      const sfax = { lat: 34.7406, lng: 10.7603 };
      
      const distance = calculateDistance(tunis.lat, tunis.lng, sfax.lat, sfax.lng);
      
      // Distance should be approximately 230km
      expect(distance).toBeCloseTo(230, 0);
    });

    it('should return 0 for same coordinates', () => {
      const distance = calculateDistance(36.8065, 10.1815, 36.8065, 10.1815);
      expect(distance).toBe(0);
    });

    it('should handle negative coordinates', () => {
      const distance = calculateDistance(40.7128, -74.0060, 34.0522, -118.2437);
      // Distance between NYC and LA should be approximately 3944km
      expect(distance).toBeCloseTo(3944, 0);
    });
  });

  describe('formatDistance', () => {
    it('should format distance in meters for distances less than 1km', () => {
      expect(formatDistance(0.5)).toBe('500m away');
      expect(formatDistance(0.1)).toBe('100m away');
    });

    it('should format distance in kilometers for distances 1km or more', () => {
      expect(formatDistance(1.5)).toBe('1.5km away');
      expect(formatDistance(10.2)).toBe('10.2km away');
    });
  });

  describe('calculateETA', () => {
    it('should calculate ETA based on distance and speed', () => {
      const eta = calculateETA(20, 30); // 20km at 30km/h
      expect(eta).toBe(40); // 40 minutes
    });

    it('should use default speed of 20km/h', () => {
      const eta = calculateETA(10); // 10km at default 20km/h
      expect(eta).toBe(30); // 30 minutes
    });
  });

  describe('formatTime', () => {
    it('should format time in minutes for less than 60 minutes', () => {
      expect(formatTime(30)).toBe('Arriving in 30 mins');
      expect(formatTime(45)).toBe('Arriving in 45 mins');
    });

    it('should format time in hours and minutes for 60+ minutes', () => {
      expect(formatTime(90)).toBe('Arriving in 1h 30m');
      expect(formatTime(125)).toBe('Arriving in 2h 5m');
    });
  });
});
