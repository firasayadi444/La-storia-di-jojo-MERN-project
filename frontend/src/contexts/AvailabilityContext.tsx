import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { apiService } from '../services/api';
import { useToast } from '@/hooks/use-toast';

interface AvailabilityContextType {
  isAvailable: boolean;
  updatingAvailability: boolean;
  updateAvailability: (isAvailable: boolean) => Promise<void>;
  refreshAvailability: () => Promise<void>;
}

const AvailabilityContext = createContext<AvailabilityContextType | undefined>(undefined);

export const useAvailability = () => {
  const context = useContext(AvailabilityContext);
  if (context === undefined) {
    throw new Error('useAvailability must be used within an AvailabilityProvider');
  }
  return context;
};

interface AvailabilityProviderProps {
  children: ReactNode;
}

export const AvailabilityProvider: React.FC<AvailabilityProviderProps> = ({ children }) => {
  const { user, updateUserAvailability } = useAuth();
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [updatingAvailability, setUpdatingAvailability] = useState<boolean>(false);
  const { toast } = useToast();

  // Initialize availability from user data when user changes
  useEffect(() => {
    if (user?.role === 'delivery') {
      setIsAvailable(user.isAvailable || false);
    }
  }, [user]);

  // Periodic refresh of availability status (every 30 seconds)
  useEffect(() => {
    if (user?.role !== 'delivery') return;

    const refreshInterval = setInterval(() => {
      refreshAvailability();
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, [user]);

  const updateAvailability = async (newAvailability: boolean) => {
    if (user?.role !== 'delivery') {
      toast({
        title: "Error",
        description: "Only delivery personnel can update availability.",
        variant: "destructive"
      });
      return;
    }

    // Check for active orders before allowing to go unavailable
    if (!newAvailability) {
      try {
        const response = await apiService.getDeliveryNotifications();
        const activeOrders = response.data || response.notifications || [];
        const hasActiveDeliveries = activeOrders.some((order: any) => 
          order.status === 'ready' || order.status === 'out_for_delivery'
        );

        if (hasActiveDeliveries) {
          toast({
            title: "Cannot Go Unavailable",
            description: "You have active deliveries in progress. Please complete your current deliveries first.",
            variant: "destructive"
          });
          return;
        }
      } catch (error) {
        console.error('Error checking active orders:', error);
        // Continue with the update if we can't check orders
      }
    }

    try {
      setUpdatingAvailability(true);
      await apiService.updateDeliveryAvailability(newAvailability);
      setIsAvailable(newAvailability);
      
      // Update the user object in AuthContext and localStorage
      updateUserAvailability(newAvailability);

      toast({
        title: "Success",
        description: `You are now ${newAvailability ? 'available' : 'unavailable'} for deliveries.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update availability.",
        variant: "destructive"
      });
      // Revert the toggle if it failed
      setIsAvailable(!newAvailability);
    } finally {
      setUpdatingAvailability(false);
    }
  };

  const refreshAvailability = async () => {
    if (user?.role !== 'delivery') return;

    try {
      // We could add an API endpoint to get current availability
      // For now, we'll just use the user data from auth context
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        if (userData.isAvailable !== isAvailable) {
          setIsAvailable(userData.isAvailable || false);
        }
      }
    } catch (error) {
      console.error('Error refreshing availability:', error);
    }
  };

  const value: AvailabilityContextType = {
    isAvailable,
    updatingAvailability,
    updateAvailability,
    refreshAvailability
  };

  return <AvailabilityContext.Provider value={value}>{children}</AvailabilityContext.Provider>;
}; 