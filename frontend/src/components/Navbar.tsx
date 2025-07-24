import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, LogOut, Home, Truck, Bell, FileText, Users, BarChart2, Inbox, Plus, Clock, Wifi, WifiOff, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useAvailability } from '../contexts/AvailabilityContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { apiService } from '../services/api';
import type { Order } from '../services/api';

const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const { getTotalItems } = useCart();
  const { isAvailable } = useAvailability();
  const location = useLocation();
  const navigate = useNavigate();
  const [deliveryNotificationsCount, setDeliveryNotificationsCount] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasActiveOrders, setHasActiveOrders] = useState(false);

  const cartItemCount = getTotalItems();

  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [newDeliveryMenCount, setNewDeliveryMenCount] = useState(0);
  const [userNotifications, setUserNotifications] = useState<Order[]>([]);
  const [userNotificationsCount, setUserNotificationsCount] = useState(0);

  // Split user notifications for dropdown
  const activeUserNotifications = userNotifications.filter(n => n.status !== 'delivered');
  const historyUserNotifications = userNotifications.filter(n => n.status === 'delivered' || n.status === 'cancelled');

  useEffect(() => {
    const fetchNotifications = async () => {
      if (isAuthenticated) {
        try {
          if (user?.role === 'admin') {
            // Fetch pending orders
            const ordersRes = await apiService.getAllOrders();
            const pendingOrders = (ordersRes.orders || ordersRes.data || []).filter(order => order.status === 'pending');
            setNewOrdersCount(pendingOrders.length);
            // Fetch pending delivery men
            const deliveryMenRes = await apiService.getPendingDeliveryMen();
            setNewDeliveryMenCount((deliveryMenRes.data || []).length);
          } else if (user?.role === 'delivery') {
            // Fetch delivery notifications
            const notificationsRes = await apiService.getDeliveryNotifications();
            const notifications = notificationsRes.data || notificationsRes.orders || [];
            setDeliveryNotificationsCount(notifications.length);
          } else if (user?.role === 'user') {
            // Fetch user notifications
            const notificationsRes = await apiService.getUserNotifications();
            const notifications = notificationsRes.data || [];
            setUserNotifications(notifications);
            setUserNotificationsCount(notifications.length);
          }
        } catch (err) {
          // Optionally handle error
        }
      }
    };
    fetchNotifications();
  }, [isAuthenticated, user]);

  // Check for active orders for delivery men
  useEffect(() => {
    if (user?.role === 'delivery') {
      const checkActiveOrders = async () => {
        try {
          const response = await apiService.getDeliveryNotifications();
          const activeOrders = response.data || [];
          const hasActive = activeOrders.some((order: Order) => 
            order.status === 'ready' || order.status === 'out_for_delivery'
          );
          setHasActiveOrders(hasActive);
        } catch (error) {
          console.error('Error checking active orders:', error);
        }
      };
      
      checkActiveOrders();
      // Check every 30 seconds
      const interval = setInterval(checkActiveOrders, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-italian-cream-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <img src="/logo.png" alt="LaStoria Di JoJo Logo" className="w-10 h-10 rounded-full shadow-md bg-white object-contain p-1" />
            <div className="flex flex-col">
              <span className="font-serif font-bold text-xl text-gradient">LaStoria Di JoJo</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/') 
                  ? 'text-italian-green-700 bg-italian-green-50' 
                  : 'text-gray-600 hover:text-italian-green-700 hover:bg-italian-cream-50'
              }`}
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Link>

            {isAuthenticated && user?.role === 'user' && (
              <>
                <Link
                  to="/orders"
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/orders') 
                      ? 'text-italian-green-700 bg-italian-green-50' 
                      : 'text-gray-600 hover:text-italian-green-700 hover:bg-italian-cream-50'
                  }`}
                >
                  <Clock className="h-4 w-4" />
                  <span>My Orders</span>
                </Link>
                <Link
                  to="/orders/history"
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/orders/history') 
                      ? 'text-italian-green-700 bg-italian-green-50' 
                      : 'text-gray-600 hover:text-italian-green-700 hover:bg-italian-cream-50'
                  }`}
                >
                  <Inbox className="h-4 w-4" />
                  <span>Order History</span>
                </Link>
              </>
            )}

            {isAuthenticated && (
              <>
                {user?.role === 'admin' && (
                  <>
                    <Link to="/admin/feedbacks" className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/admin/feedbacks') ? 'text-italian-green-700 bg-italian-green-50' : 'text-gray-600 hover:text-italian-green-700 hover:bg-italian-cream-50'}`}>
                      <FileText className="h-4 w-4" />
                      <span>Feedbacks</span>
                    </Link>
                    <Link to="/admin/add-food" className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/admin/add-food') ? 'text-italian-green-700 bg-italian-green-50' : 'text-gray-600 hover:text-italian-green-700 hover:bg-italian-cream-50'}`}>
                      <Plus className="h-4 w-4" />
                      <span>Food Management</span>
                    </Link>
                    <Link to="/admin/analytics" className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/admin/analytics') ? 'text-italian-green-700 bg-italian-green-50' : 'text-gray-600 hover:text-italian-green-700 hover:bg-italian-cream-50'}`}>
                      <BarChart2 className="h-4 w-4" />
                      <span>History & Financials</span>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/admin/deliverymen') || isActive('/admin/users') ? 'text-italian-green-700 bg-italian-green-50' : 'text-gray-600 hover:text-italian-green-700 hover:bg-italian-cream-50'}`}>
                          <Users className="h-4 w-4" />
                          <span>Management</span>
                          {newDeliveryMenCount > 0 && (
                            <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white">{newDeliveryMenCount}</span>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-white border shadow-lg">
                        <DropdownMenuItem asChild>
                          <Link to="/admin/users" className="flex items-center space-x-2 px-3 py-2">
                            <Users className="h-4 w-4" />
                            <span>User Management</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/admin/deliverymen" className="flex items-center space-x-2 px-3 py-2">
                            <Truck className="h-4 w-4" />
                            <span>Delivery Men</span>
                            {newDeliveryMenCount > 0 && (
                              <Badge className="ml-auto bg-red-500 text-white text-xs">
                                {newDeliveryMenCount}
                              </Badge>
                            )}
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Link to="/admin/orders" className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/admin/orders') ? 'text-italian-green-700 bg-italian-green-50' : 'text-gray-600 hover:text-italian-green-700 hover:bg-italian-cream-50'}`}>
                      <Inbox className="h-4 w-4" />
                      <span>Orders</span>
                      {newOrdersCount > 0 && (
                        <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white">{newOrdersCount}</span>
                      )}
                    </Link>
                    <Link to="/admin/ordershistory" className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/admin/ordershistory') ? 'text-italian-green-700 bg-italian-green-50' : 'text-gray-600 hover:text-italian-green-700 hover:bg-italian-cream-50'}`}
                      style={{ borderLeft: isActive('/admin/ordershistory') ? '4px solid #16a34a' : undefined }}>
                      <Clock className="h-4 w-4" />
                      <span>Order History</span>
                    </Link>
                  </>
                )}

                {user?.role === 'delivery' && (
                  <>
                    <Link
                      to="/delivery"
                      className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive('/delivery') 
                          ? 'text-italian-green-700 bg-italian-green-50' 
                          : 'text-gray-600 hover:text-italian-green-700 hover:bg-italian-cream-50'
                      }`}
                    >
                      <Truck className="h-4 w-4" />
                      <span>Delivery</span>
                      {deliveryNotificationsCount > 0 && (
                        <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white">{deliveryNotificationsCount}</span>
                      )}
                    </Link>
                    <Link
                      to="/delivery-stats"
                      className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive('/delivery-stats') 
                          ? 'text-italian-green-700 bg-italian-green-50' 
                          : 'text-gray-600 hover:text-italian-green-700 hover:bg-italian-cream-50'
                      }`}
                    >
                      <TrendingUp className="h-4 w-4" />
                      <span>Stats & History</span>
                    </Link>
                  </>
                )}

                {/* Availability Indicator for Delivery Men */}
                {user?.role === 'delivery' && (
                  <div className="flex items-center space-x-2 px-3 py-2">
                    {isAvailable ? (
                      <Wifi className="h-4 w-4 text-green-600" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm font-medium text-gray-600">
                      {isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                    {hasActiveOrders && (
                      <span className="text-xs text-orange-600 bg-orange-100 px-1 py-0.5 rounded">
                        Active
                      </span>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            {isAuthenticated && user?.role === 'user' && (
              <Link to="/cart" className="relative p-2 text-gray-600 hover:text-italian-green-700 transition-colors">
                <ShoppingCart className="h-6 w-6" />
                {cartItemCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-italian-green-700 text-white text-xs flex items-center justify-center p-0">
                    {cartItemCount}
                  </Badge>
                )}
              </Link>
            )}

            {/* User Notifications */}
            {isAuthenticated && user?.role === 'user' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative p-2">
                    <Bell className="h-6 w-6 text-gray-600" />
                    {userNotificationsCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center p-0">
                        {userNotificationsCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 bg-white border shadow-lg">
                  <div className="p-2 font-semibold text-gray-700 border-b">Order Updates</div>
                  {/* Active Orders Section */}
                  <div className="px-2 pt-2 pb-1 text-sm font-bold text-italian-green-700">Active Orders</div>
                  {activeUserNotifications.length === 0 ? (
                    <div className="px-4 pb-2 text-gray-500 text-sm">No active order notifications</div>
                  ) : (
                    activeUserNotifications.slice(0, 5).map((notif) => (
                      <div key={notif._id} className="p-3 border-b last:border-b-0 hover:bg-gray-50">
                        <div className="font-medium">Order #{notif._id.slice(-6)}</div>
                        <div className="text-xs text-gray-600">Status: {notif.status.replace('_', ' ')}</div>
                        <div className="text-xs text-gray-500">Updated: {new Date(notif.updatedAt).toLocaleString()}</div>
                      </div>
                    ))
                  )}
                  {/* Order History Section */}
                  <div className="px-2 pt-2 pb-1 text-sm font-bold text-italian-green-700">Order History</div>
                  {historyUserNotifications.length === 0 ? (
                    <div className="px-4 pb-2 text-gray-500 text-sm">No order history notifications</div>
                  ) : (
                    historyUserNotifications.slice(0, 5).map((notif) => (
                      <div key={notif._id} className="p-3 border-b last:border-b-0 hover:bg-gray-50">
                        <div className="font-medium">Order #{notif._id.slice(-6)}</div>
                        <div className="text-xs text-gray-600">Status: {notif.status.replace('_', ' ')}</div>
                        <div className="text-xs text-gray-500">Updated: {new Date(notif.updatedAt).toLocaleString()}</div>
                      </div>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}



            {/* User Menu */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 p-2">
                    <div className="w-8 h-8 bg-gradient-secondary rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-italian-green-800" />
                    </div>
                    <span className="hidden md:block text-sm font-medium">{user?.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white border shadow-lg">
                  {user?.role === 'delivery' && (
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="flex items-center space-x-2 px-3 py-2">
                        <User className="h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {user?.role === 'delivery' && (
                    <DropdownMenuItem asChild>
                      <Link to="/delivery" className="flex items-center space-x-2 px-3 py-2">
                        <Truck className="h-4 w-4" />
                        <span>Delivery Management</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {user?.role === 'user' && (
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center space-x-2 px-3 py-2">
                        <User className="h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center space-x-2 px-3 py-2 text-red-600">
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button className="btn-gradient text-white" asChild>
                  <Link to="/register">Join Family</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              className="md:hidden p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-italian-cream-200 animate-slide-up">
            <div className="flex flex-col space-y-2">
              <Link
                to="/"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-italian-green-700 hover:bg-italian-cream-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              {isAuthenticated && user?.role === 'user' && (
                <Link
                  to="/orders"
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-italian-green-700 hover:bg-italian-cream-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Clock className="h-4 w-4" />
                  <span>My Orders</span>
                </Link>
              )}
              {isAuthenticated && user?.role === 'user' && (
                <Link
                  to="/profile"
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-italian-green-700 hover:bg-italian-cream-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </Link>
              )}
              {isAuthenticated && (
                <>
                  {user?.role === 'user' && (
                    <Link
                      to="/cart"
                      className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-italian-green-700 hover:bg-italian-cream-50"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      <span>Cart ({cartItemCount})</span>
                    </Link>
                  )}
                  {user?.role === 'delivery' && (
                    <Link
                      to="/dashboard"
                      className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-italian-green-700 hover:bg-italian-cream-50"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                  )}
                  {user?.role === 'delivery' && (
                    <Link
                      to="/delivery"
                      className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-italian-green-700 hover:bg-italian-cream-50"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Truck className="h-4 w-4" />
                      <span>Delivery</span>
                    </Link>
                  )}
                  {user?.role === 'admin' && (
                    <Link
                      to="/admin/users"
                      className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-italian-green-700 hover:bg-italian-cream-50"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Users className="h-4 w-4" />
                      <span>User Management</span>
                    </Link>
                  )}
                  {user?.role === 'admin' && (
                    <Link
                      to="/admin/deliverymen"
                      className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-italian-green-700 hover:bg-italian-cream-50"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Truck className="h-4 w-4" />
                      <span>Delivery Men</span>
                    </Link>
                  )}
                  {user?.role === 'admin' && (
                    <Link
                      to="/admin/feedbacks"
                      className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-italian-green-700 hover:bg-italian-cream-50"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <FileText className="h-4 w-4" />
                      <span>Feedbacks</span>
                    </Link>
                  )}
                  {user?.role === 'admin' && (
                    <Link
                      to="/admin/analytics"
                      className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-italian-green-700 hover:bg-italian-cream-50"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <BarChart2 className="h-4 w-4" />
                      <span>Analytics</span>
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
