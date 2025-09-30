import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, Trash2, Clock, Inbox } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import type { Order } from '../services/api';

const NotificationCenter: React.FC = () => {
  const { notifications, removeNotification, clearNotifications } = useSocket();
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [orderNotifications, setOrderNotifications] = useState<Order[]>([]);
  const autoDismissTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Auto-dismiss notifications after 5 seconds when they become visible
  useEffect(() => {
    if (isOpen) {
      // Set up auto-dismiss timers for all unread notifications
      notifications.forEach(notification => {
        if (!notification.read && !autoDismissTimers.current.has(notification.id)) {
          const timer = setTimeout(() => {
            removeNotification(notification.id);
            autoDismissTimers.current.delete(notification.id);
          }, 5000); // 5 seconds

          autoDismissTimers.current.set(notification.id, timer);
        }
      });
    } else {
      // Clear all timers when notification center is closed
      autoDismissTimers.current.forEach(timer => clearTimeout(timer));
      autoDismissTimers.current.clear();
    }
  }, [isOpen, notifications, removeNotification]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      autoDismissTimers.current.forEach(timer => clearTimeout(timer));
    };
  }, []);

  // Fetch order notifications for users
  useEffect(() => {
    const fetchOrderNotifications = async () => {
      if (isAuthenticated && user?.role === 'user') {
        try {
          const notificationsRes = await apiService.getUserNotifications();
          const notifications = notificationsRes.data || [];
          setOrderNotifications(notifications);
        } catch (err) {
          console.error('Error fetching order notifications:', err);
        }
      }
    };
    fetchOrderNotifications();
  }, [isAuthenticated, user]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const orderNotificationsCount = orderNotifications.length;
  const totalUnreadCount = unreadCount + orderNotificationsCount;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order-update':
        return '📦';
      case 'delivery-assigned':
        return '🚚';
      case 'new-order':
        return '🆕';
      case 'application-updated':
        return '📋';
      case 'order':
        return '📦';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'order-update':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delivery-assigned':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'new-order':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'application-updated':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'order':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const markAsRead = (id: string) => {
    // Clear the auto-dismiss timer if it exists
    const timer = autoDismissTimers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      autoDismissTimers.current.delete(id);
    }
    
    // Remove the notification
    removeNotification(id);
  };

  const markAllAsRead = () => {
    // Clear all auto-dismiss timers
    autoDismissTimers.current.forEach(timer => clearTimeout(timer));
    autoDismissTimers.current.clear();
    
    // Clear all notifications
    clearNotifications();
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {totalUnreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute right-0 top-12 w-80 z-50 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Notifications
            </CardTitle>
            <div className="flex items-center gap-2">
              {(notifications.length > 0 || orderNotifications.length > 0) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="h-8 px-2 text-xs"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {notifications.length === 0 && orderNotifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No notifications
                </div>
              ) : (
                <div className="space-y-1">
                  {/* Real-time Socket Notifications */}
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-lg">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {notification.title}
                              </h4>
                              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                                Auto-dismiss in 5s
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeNotification(notification.id)}
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-400">
                              {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                            </span>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getNotificationColor(notification.type)}`}
                            >
                              {notification.type.replace('-', ' ')}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Order Notifications for Users */}
                  {user?.role === 'user' && orderNotifications.length > 0 && (
                    <>
                      {/* Active Orders Section */}
                      <div className="px-3 pt-2 pb-1 text-sm font-bold text-italian-green-700 border-t border-gray-100">
                        <Clock className="h-4 w-4 inline mr-1" />
                        Active Orders
                      </div>
                      {orderNotifications.filter(n => n.status !== 'delivered' && n.status !== 'cancelled').length === 0 ? (
                        <div className="px-4 pb-2 text-gray-500 text-sm">No active order notifications</div>
                      ) : (
                        orderNotifications
                          .filter(n => n.status !== 'delivered' && n.status !== 'cancelled')
                          .slice(0, 5)
                          .map((order) => (
                            <div key={order._id} className="p-3 border-b border-gray-100 hover:bg-gray-50">
                              <div className="flex items-start gap-3">
                                <div className="text-lg">📦</div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium">Order #{order._id.slice(-6)}</div>
                                  <div className="text-xs text-gray-600">Status: {order.status.replace('_', ' ')}</div>
                                  <div className="text-xs text-gray-500">Updated: {new Date(order.updatedAt).toLocaleString()}</div>
                                </div>
                              </div>
                            </div>
                          ))
                      )}

                      {/* Order History Section */}
                      <div className="px-3 pt-2 pb-1 text-sm font-bold text-italian-green-700 border-t border-gray-100">
                        <Inbox className="h-4 w-4 inline mr-1" />
                        Order History
                      </div>
                      {orderNotifications.filter(n => n.status === 'delivered' || n.status === 'cancelled').length === 0 ? (
                        <div className="px-4 pb-2 text-gray-500 text-sm">No order history notifications</div>
                      ) : (
                        orderNotifications
                          .filter(n => n.status === 'delivered' || n.status === 'cancelled')
                          .slice(0, 5)
                          .map((order) => (
                            <div key={order._id} className="p-3 border-b border-gray-100 hover:bg-gray-50">
                              <div className="flex items-start gap-3">
                                <div className="text-lg">📦</div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium">Order #{order._id.slice(-6)}</div>
                                  <div className="text-xs text-gray-600">Status: {order.status.replace('_', ' ')}</div>
                                  <div className="text-xs text-gray-500">Updated: {new Date(order.updatedAt).toLocaleString()}</div>
                                </div>
                              </div>
                            </div>
                          ))
                      )}
                    </>
                  )}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NotificationCenter;
