import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, LogOut, Home, Truck, Bell, FileText, Users, BarChart2, Inbox } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { apiService } from '../services/api';

const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const { getTotalItems } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const cartItemCount = getTotalItems();

  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [newDeliveryMenCount, setNewDeliveryMenCount] = useState(0);
  const [deliveryNotificationsCount, setDeliveryNotificationsCount] = useState(0);

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
            setNewDeliveryMenCount((deliveryMenRes.pending || deliveryMenRes.data || []).length);
          } else if (user?.role === 'delivery') {
            // Fetch delivery notifications
            const notificationsRes = await apiService.getDeliveryNotifications();
            const notifications = notificationsRes.notifications || notificationsRes.data || [];
            setDeliveryNotificationsCount(notifications.length);
          }
        } catch (err) {
          // Optionally handle error
        }
      }
    };
    fetchNotifications();
  }, [isAuthenticated, user]);

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
              <span className="text-xs text-italian-green-600 font-medium -mt-1">Authentic Italian</span>
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

            {isAuthenticated && (
              <>
                {user?.role === 'delivery' && (
                  <Link
                    to="/dashboard"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/dashboard') 
                        ? 'text-italian-green-700 bg-italian-green-50' 
                        : 'text-gray-600 hover:text-italian-green-700 hover:bg-italian-cream-50'
                    }`}
                  >
                    Dashboard
                  </Link>
                )}
                {user?.role === 'admin' && (
                  <>
                    <Link to="/admin/feedbacks" className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/admin/feedbacks') ? 'text-italian-green-700 bg-italian-green-50' : 'text-gray-600 hover:text-italian-green-700 hover:bg-italian-cream-50'}`}>
                      <FileText className="h-4 w-4" />
                      <span>Feedbacks</span>
                    </Link>
                    <Link to="/admin/analytics" className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/admin/analytics') ? 'text-italian-green-700 bg-italian-green-50' : 'text-gray-600 hover:text-italian-green-700 hover:bg-italian-cream-50'}`}>
                      <BarChart2 className="h-4 w-4" />
                      <span>History & Financials</span>
                    </Link>
                    <Link to="/admin/deliverymen" className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/admin/deliverymen') ? 'text-italian-green-700 bg-italian-green-50' : 'text-gray-600 hover:text-italian-green-700 hover:bg-italian-cream-50'}`}>
                      <Users className="h-4 w-4" />
                      <span>Delivery Men</span>
                      {newDeliveryMenCount > 0 && (
                        <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white">{newDeliveryMenCount}</span>
                      )}
                    </Link>
                    <Link to="/admin/orders" className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/admin/orders') ? 'text-italian-green-700 bg-italian-green-50' : 'text-gray-600 hover:text-italian-green-700 hover:bg-italian-cream-50'}`}>
                      <Inbox className="h-4 w-4" />
                      <span>Orders</span>
                      {newOrdersCount > 0 && (
                        <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white">{newOrdersCount}</span>
                      )}
                    </Link>
                  </>
                )}

                {user?.role === 'delivery' && (
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
                )}
              </>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            {isAuthenticated && user?.role !== 'delivery' && (
              <Link to="/cart" className="relative p-2 text-gray-600 hover:text-italian-green-700 transition-colors">
                <ShoppingCart className="h-6 w-6" />
                {cartItemCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-italian-green-700 text-white text-xs flex items-center justify-center p-0">
                    {cartItemCount}
                  </Badge>
                )}
              </Link>
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
              {isAuthenticated && (
                <>
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
