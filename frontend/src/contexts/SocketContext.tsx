import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

interface Notification {
  id: string;
  type: 'order-update' | 'delivery-assigned' | 'new-order' | 'application-updated';
  title: string;
  message: string;
  order?: any;
  application?: any;
  timestamp: Date;
  read: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user && user._id) {
      // Initialize socket connection
      const newSocket = io('http://localhost:5000', {
        withCredentials: true,
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        setIsConnected(true);
        
        // Join appropriate room based on user role
        newSocket.emit('join-room', {
          userId: user._id,
          role: user.role
        });
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
      });

      // Listen for order updates
      newSocket.on('order-updated', (data) => {
        addNotification({
          id: `order-${data.order._id}-${Date.now()}`,
          type: 'order-update',
          title: 'Order Update',
          message: data.message,
          order: data.order,
          timestamp: new Date(),
          read: false
        });
      });

      // Listen for delivery assignments
      newSocket.on('delivery-assigned', (data) => {
        addNotification({
          id: `delivery-${data.order._id}-${Date.now()}`,
          type: 'delivery-assigned',
          title: 'Delivery Assignment',
          message: data.message,
          order: data.order,
          timestamp: new Date(),
          read: false
        });
      });

      // Listen for new orders (admin and delivery)
      newSocket.on('new-order', (data) => {
        addNotification({
          id: `new-order-${data.order._id}-${Date.now()}`,
          type: 'new-order',
          title: 'New Order',
          message: data.message,
          order: data.order,
          timestamp: new Date(),
          read: false
        });
      });

      // Listen for application updates (delivery applications)
      newSocket.on('application-updated', (data) => {
        addNotification({
          id: `app-${data.application._id}-${Date.now()}`,
          type: 'application-updated',
          title: 'Application Update',
          message: data.message,
          application: data.application,
          timestamp: new Date(),
          read: false
        });
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } else {
      // Disconnect socket if user logs out
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [user]);

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep last 50 notifications
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const value: SocketContextType = {
    socket,
    isConnected,
    notifications,
    addNotification,
    removeNotification,
    clearNotifications
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
