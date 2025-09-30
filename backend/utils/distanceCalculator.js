/**
 * Distance and Time Estimation Utilities
 * Provides functions to calculate distances and estimate delivery times
 */

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in meters
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
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
};

/**
 * Calculate estimated delivery time based on distance and average speed
 * @param {number} distance - Distance in meters
 * @param {number} averageSpeed - Average speed in km/h (default: 25 km/h for city delivery)
 * @param {number} preparationTime - Additional time for food preparation in minutes (default: 15)
 * @returns {Object} Time estimation object
 */
const estimateDeliveryTime = (distance, averageSpeed = 25, preparationTime = 15) => {
  // Convert distance from meters to kilometers
  const distanceKm = distance / 1000;
  
  // Calculate travel time in minutes
  const travelTimeMinutes = (distanceKm / averageSpeed) * 60;
  
  // Add preparation time and buffer time (10% extra for traffic, stops, etc.)
  const totalTimeMinutes = Math.ceil((travelTimeMinutes + preparationTime) * 1.1);
  
  // Create estimated delivery time
  const estimatedDeliveryTime = new Date();
  estimatedDeliveryTime.setMinutes(estimatedDeliveryTime.getMinutes() + totalTimeMinutes);
  
  return {
    distance: Math.round(distance),
    distanceKm: Math.round(distanceKm * 100) / 100,
    travelTimeMinutes: Math.round(travelTimeMinutes),
    preparationTimeMinutes: preparationTime,
    totalTimeMinutes: totalTimeMinutes,
    estimatedDeliveryTime: estimatedDeliveryTime,
    averageSpeed: averageSpeed
  };
};

/**
 * Find the nearest available delivery person to a customer location
 * @param {Array} deliveryPersons - Array of delivery person objects with location data
 * @param {number} customerLat - Customer latitude
 * @param {number} customerLng - Customer longitude
 * @returns {Object} Nearest delivery person with distance and time estimation
 */
const findNearestDeliveryPerson = (deliveryPersons, customerLat, customerLng) => {
  if (!deliveryPersons || deliveryPersons.length === 0) {
    return null;
  }

  let nearestDeliveryPerson = null;
  let shortestDistance = Infinity;
  let bestTimeEstimate = null;

  deliveryPersons.forEach(deliveryPerson => {
    // Check if delivery person has valid location data
    if (!deliveryPerson.currentLocation || 
        !deliveryPerson.currentLocation.coordinates || 
        deliveryPerson.currentLocation.coordinates.length !== 2) {
      return; // Skip delivery persons without valid location
    }

    const [deliveryLng, deliveryLat] = deliveryPerson.currentLocation.coordinates;
    
    // Calculate distance
    const distance = calculateDistance(customerLat, customerLng, deliveryLat, deliveryLng);
    
    // Only consider delivery persons within reasonable range (50km)
    if (distance > 50000) {
      return;
    }

    if (distance < shortestDistance) {
      shortestDistance = distance;
      nearestDeliveryPerson = deliveryPerson;
      
      // Calculate time estimate for this delivery person
      const averageSpeed = getDeliveryPersonAverageSpeed(deliveryPerson);
      bestTimeEstimate = estimateDeliveryTime(distance, averageSpeed);
    }
  });

  return nearestDeliveryPerson ? {
    deliveryPerson: nearestDeliveryPerson,
    distance: shortestDistance,
    timeEstimate: bestTimeEstimate
  } : null;
};

/**
 * Get average speed for a delivery person based on their vehicle type and performance
 * @param {Object} deliveryPerson - Delivery person object
 * @returns {number} Average speed in km/h
 */
const getDeliveryPersonAverageSpeed = (deliveryPerson) => {
  // Base speeds by vehicle type
  const vehicleSpeeds = {
    'bicycle': 15,    // 15 km/h
    'motorcycle': 30, // 30 km/h
    'car': 25,        // 25 km/h
    'scooter': 20,    // 20 km/h
    'walking': 5      // 5 km/h
  };

  const vehicleType = deliveryPerson.vehicleType?.toLowerCase() || 'motorcycle';
  let baseSpeed = vehicleSpeeds[vehicleType] || 25; // Default to 25 km/h

  // Adjust speed based on delivery person's performance history
  if (deliveryPerson.deliveryStats) {
    const { averageSpeed, totalDeliveries } = deliveryPerson.deliveryStats;
    
    // If delivery person has performance data, use their actual average speed
    if (averageSpeed && totalDeliveries > 5) {
      baseSpeed = averageSpeed;
    }
  }

  // Apply traffic and weather adjustments (could be enhanced with real-time data)
  const trafficMultiplier = getTrafficMultiplier();
  const weatherMultiplier = getWeatherMultiplier();
  
  return Math.round(baseSpeed * trafficMultiplier * weatherMultiplier);
};

/**
 * Get traffic multiplier based on time of day (simplified)
 * @returns {number} Traffic multiplier (0.7 to 1.0)
 */
const getTrafficMultiplier = () => {
  const hour = new Date().getHours();
  
  // Rush hours: 7-9 AM and 5-7 PM
  if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
    return 0.7; // 30% slower during rush hours
  }
  
  // Late night/early morning: 11 PM - 6 AM
  if (hour >= 23 || hour <= 6) {
    return 0.9; // 10% slower due to reduced visibility
  }
  
  return 1.0; // Normal speed
};

/**
 * Get weather multiplier (simplified - could be enhanced with real weather API)
 * @returns {number} Weather multiplier (0.8 to 1.0)
 */
const getWeatherMultiplier = () => {
  // This is a simplified version. In production, you'd integrate with a weather API
  // For now, we'll use a random factor to simulate weather conditions
  const random = Math.random();
  
  if (random < 0.1) {
    return 0.8; // 20% slower in bad weather (rain, snow)
  }
  
  return 1.0; // Normal speed in good weather
};

/**
 * Calculate real-time ETA update based on current delivery person location
 * @param {Object} order - Order object with customer location
 * @param {Object} deliveryPerson - Delivery person object with current location
 * @param {string} orderStatus - Current order status
 * @returns {Object} Updated time estimation
 */
const calculateRealTimeETA = (order, deliveryPerson, orderStatus) => {
  if (!order.customerLocation || !deliveryPerson.currentLocation) {
    return null;
  }

  const customerLat = order.customerLocation.latitude;
  const customerLng = order.customerLocation.longitude;
  const [deliveryLng, deliveryLat] = deliveryPerson.currentLocation.coordinates;

  const distance = calculateDistance(customerLat, customerLng, deliveryLat, deliveryLng);
  const averageSpeed = getDeliveryPersonAverageSpeed(deliveryPerson);
  
  // Adjust preparation time based on order status
  let preparationTime = 0;
  switch (orderStatus) {
    case 'pending':
    case 'confirmed':
      preparationTime = 15; // Full preparation time
      break;
    case 'preparing':
      preparationTime = 10; // Half preparation time
      break;
    case 'ready':
      preparationTime = 5; // Minimal preparation time
      break;
    case 'out_for_delivery':
      preparationTime = 0; // No preparation time needed
      break;
    default:
      preparationTime = 0;
  }

  return estimateDeliveryTime(distance, averageSpeed, preparationTime);
};

/**
 * Format time estimation for display
 * @param {Object} timeEstimate - Time estimation object
 * @returns {Object} Formatted time estimation
 */
const formatTimeEstimate = (timeEstimate) => {
  if (!timeEstimate) {
    return null;
  }

  const now = new Date();
  const deliveryTime = new Date(timeEstimate.estimatedDeliveryTime);
  const timeDiff = deliveryTime.getTime() - now.getTime();
  
  // Calculate remaining time
  const remainingMinutes = Math.max(0, Math.round(timeDiff / (1000 * 60)));
  const remainingHours = Math.floor(remainingMinutes / 60);
  const remainingMins = remainingMinutes % 60;

  return {
    ...timeEstimate,
    remainingMinutes,
    remainingHours,
    remainingMins,
    formattedTime: remainingHours > 0 
      ? `${remainingHours}h ${remainingMins}m`
      : `${remainingMins}m`,
    isOverdue: timeDiff < 0,
    deliveryTimeFormatted: deliveryTime.toLocaleTimeString()
  };
};

module.exports = {
  calculateDistance,
  estimateDeliveryTime,
  findNearestDeliveryPerson,
  getDeliveryPersonAverageSpeed,
  calculateRealTimeETA,
  formatTimeEstimate,
  getTrafficMultiplier,
  getWeatherMultiplier
};
