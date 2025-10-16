# OpenRouteService Integration

This document explains the OpenRouteService API integration for real road routing in the OrderApp delivery tracking system.

## Overview

The OrderApp now uses OpenRouteService (ORS) API to provide real road routing instead of straight-line connections between delivery points. This creates more accurate and realistic route visualization for both delivery personnel and customers.

## Features

### ✅ Real Road Routing
- Fetches actual road routes from OpenRouteService API
- Supports multiple transportation profiles (driving, cycling, walking)
- Provides accurate distance and duration estimates

### ✅ Smooth Marker Animation
- Animated markers that move along the real route path
- Interpolated movement for smooth visual experience
- Automatic route recalculation when GPS coordinates update

### ✅ Error Handling & Fallbacks
- Graceful fallback to straight-line routing if ORS API fails
- Comprehensive error logging for debugging
- Loading indicators during route calculation

### ✅ Smart Context-Aware Routing
- Different routing profiles for delivery vs customer contexts
- Automatic coordinate validation
- Intelligent fallback mechanisms

## Setup Instructions

### 1. Get OpenRouteService API Key

1. Visit [OpenRouteService](https://openrouteservice.org/dev/#/signup)
2. Sign up for a free account
3. Get your API key from the dashboard

### 2. Configure Environment Variables

Create or update `frontend/.env`:

```env
# OpenRouteService API Key
VITE_ORS_API_KEY=your_actual_api_key_here

# Backend API URL
VITE_API_URL=http://localhost:5000
```

### 3. API Key Limits

The free tier includes:
- 2,000 requests per day
- 40 requests per minute
- Sufficient for development and small-scale production

For higher limits, consider upgrading to a paid plan.

## Implementation Details

### Service Architecture

```
frontend/src/services/openRouteService.ts
├── getORSRoute() - Core API integration
├── getSmartRoute() - Context-aware routing
├── getFallbackRoute() - Fallback mechanism
├── interpolateRoute() - Animation support
└── Helper functions (validation, distance calculation)
```

### Component Integration

#### DeliveryTracking Component
- **Purpose**: Real-time tracking for delivery personnel
- **Context**: 'delivery' profile (optimized for vehicle routing)
- **Features**: Live GPS updates, route recalculation, marker animation

#### TrackOrder Component  
- **Purpose**: Order tracking for customers
- **Context**: 'customer' profile (optimized for viewing)
- **Features**: Delivery person tracking, route visualization

### Route Data Structure

```typescript
interface RouteResult {
  coordinates: [number, number][]; // Array of [lat, lng] pairs
  distance: number;                // Distance in meters
  duration: number;                // Duration in seconds
}
```

### Animation System

The marker animation system:
1. **Interpolates** route coordinates for smooth movement
2. **Finds** the closest point on route to current GPS position
3. **Animates** from current position to destination
4. **Updates** in real-time as new GPS coordinates arrive

## API Usage Examples

### Basic Route Fetching

```typescript
import { getSmartRoute } from '@/services/openRouteService';

const route = await getSmartRoute(
  { lat: 36.8065, lng: 10.1815 }, // Start point
  { lat: 36.8065, lng: 10.1815 }, // End point
  'delivery'                       // Context
);
```

### Fallback Handling

```typescript
import { getSmartRoute, getFallbackRoute } from '@/services/openRouteService';

try {
  const route = await getSmartRoute(start, end, 'delivery');
  if (!route) {
    // Use fallback if ORS fails
    route = getFallbackRoute(start, end);
  }
} catch (error) {
  // Handle errors gracefully
  console.error('Routing failed:', error);
}
```

## Configuration Options

### Transportation Profiles

| Profile | Description | Use Case |
|---------|-------------|----------|
| `driving-car` | Standard car routing | Default delivery routing |
| `driving-hgv` | Heavy goods vehicle | Large delivery vehicles |
| `cycling-regular` | Regular cycling | Bike delivery |
| `cycling-road` | Road cycling | Fast bike delivery |
| `foot-walking` | Walking routes | Pedestrian delivery |

### Context Selection

- **'delivery'**: Optimized for delivery personnel (driving-car profile)
- **'customer'**: Optimized for customer viewing (driving-car profile)

## Performance Considerations

### Caching
- Routes are cached in component state
- Recalculated only when coordinates change significantly
- Automatic cleanup on component unmount

### Rate Limiting
- Built-in request throttling
- Graceful degradation on API limits
- Fallback routing prevents service interruption

### Memory Management
- Animation frames are properly cleaned up
- Route data is cleared when components unmount
- No memory leaks from continuous animations

## Troubleshooting

### Common Issues

1. **"VITE_ORS_API_KEY not found"**
   - Check `.env` file exists in `frontend/` directory
   - Verify API key is correctly set
   - Restart development server after adding environment variables

2. **"ORS API error: 401 Unauthorized"**
   - Verify API key is valid and active
   - Check API key hasn't expired
   - Ensure no extra spaces in environment variable

3. **"ORS API error: 429 Too Many Requests"**
   - You've exceeded the rate limit
   - Wait a few minutes before making more requests
   - Consider upgrading to a paid plan for higher limits

4. **Routes not displaying**
   - Check browser console for error messages
   - Verify coordinates are valid (latitude: -90 to 90, longitude: -180 to 180)
   - Fallback routes should still display as straight lines

### Debug Mode

Enable detailed logging by opening browser console. Look for:
- `🗺️ Fetching route from OpenRouteService...` - Route calculation started
- `✅ Route fetched successfully` - Route calculation completed
- `⚠️ Using fallback route` - ORS API failed, using fallback
- `❌ ORS routing error` - Detailed error information

## Future Enhancements

### Planned Features
- **Route Optimization**: Multi-stop route optimization for delivery efficiency
- **Traffic Integration**: Real-time traffic data for more accurate ETAs
- **Alternative Routes**: Show multiple route options
- **Offline Support**: Cached routes for offline usage
- **Custom Waypoints**: Allow manual waypoint addition

### Performance Improvements
- **Route Caching**: Persistent route caching across sessions
- **Batch Requests**: Multiple route requests in single API call
- **Predictive Routing**: Pre-calculate routes for common destinations

## Support

For issues related to:
- **OpenRouteService API**: Contact [ORS Support](https://openrouteservice.org/support/)
- **Integration Issues**: Check this documentation and browser console logs
- **Feature Requests**: Create an issue in the project repository

## License

This integration uses the OpenRouteService API, which has its own terms of service. Please review the ORS license agreement when using their services.
