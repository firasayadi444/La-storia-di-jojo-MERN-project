# Availability Context

## Overview
The `AvailabilityContext` manages the availability status of delivery personnel across the application. It ensures that the availability state persists across page navigation and stays synchronized between different components.

## Features
- **Persistent State**: Availability status persists across page navigation
- **Real-time Updates**: Updates are immediately reflected in all components
- **Server Synchronization**: Changes are saved to the server and persisted in localStorage
- **Automatic Refresh**: Periodically refreshes availability status every 30 seconds
- **Error Handling**: Provides proper error handling and user feedback

## Usage

### Basic Usage
```tsx
import { useAvailability } from '../contexts/AvailabilityContext';

const MyComponent = () => {
  const { isAvailable, updatingAvailability, updateAvailability } = useAvailability();
  
  const handleToggle = async () => {
    await updateAvailability(!isAvailable);
  };
  
  return (
    <div>
      <p>Status: {isAvailable ? 'Available' : 'Unavailable'}</p>
      <button 
        onClick={handleToggle}
        disabled={updatingAvailability}
      >
        {updatingAvailability ? 'Updating...' : 'Toggle Availability'}
      </button>
    </div>
  );
};
```

### Available Properties
- `isAvailable: boolean` - Current availability status
- `updatingAvailability: boolean` - Loading state during updates
- `updateAvailability(isAvailable: boolean): Promise<void>` - Update availability status
- `refreshAvailability(): Promise<void>` - Manually refresh availability status

## Integration with Other Contexts

### AuthContext Integration
The `AvailabilityContext` integrates with `AuthContext` to:
- Initialize availability from user data
- Update user object when availability changes
- Persist changes in localStorage

### Components Using AvailabilityContext
- `DeliveryDashboard` - Main delivery management interface
- `Navbar` - Shows availability status in navigation
- Any other component that needs to display or manage availability

## Architecture

### State Management
1. **Local State**: Manages `isAvailable` and `updatingAvailability`
2. **Server Sync**: Updates availability via API call
3. **AuthContext Sync**: Updates user object in AuthContext
4. **localStorage Sync**: Persists changes in browser storage

### Lifecycle
1. **Initialization**: Sets availability from user data on mount
2. **Updates**: Handles availability toggle with server sync
3. **Refresh**: Periodically checks for changes every 30 seconds
4. **Cleanup**: Clears intervals on unmount

## Error Handling
- Network errors are caught and displayed via toast notifications
- Failed updates revert the local state
- Only delivery personnel can update availability

## Best Practices
- Always check `updatingAvailability` before allowing new updates
- Use the context in components that need real-time availability status
- Handle loading states appropriately in UI components 