import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAvailability } from '../contexts/AvailabilityContext';
import { apiService, Order } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useSocket } from '../contexts/SocketContext';
import { 
  MapPin, 
  Clock, 
  User, 
  Phone, 
  Truck, 
  CheckCircle, 
  AlertCircle,
  Package,
  Navigation,
  Bell,
  XCircle,
  DollarSign,
  TrendingUp,
  Calendar,
  Wifi,
  WifiOff,
  CreditCard,
  Banknote,
  RefreshCw
} from 'lucide-react';

const DeliveryDashboard: React.FC = () => {
  const { user } = useAuth();
  const { isAvailable, updatingAvailability, updateAvailability } = useAvailability();
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  const { registerRefreshCallback, unregisterRefreshCallback } = useSocket();

  // Fix: Only show orders assigned to this delivery man and with correct status
  const activeOrders = orders.filter(order =>
    (order.status === 'ready' || order.status === 'out_for_delivery') &&
    order.deliveryMan &&
    ((typeof order.deliveryMan === 'string' && order.deliveryMan === user?._id) ||
     (typeof order.deliveryMan === 'object' && order.deliveryMan._id === user?._id))
  );

  // Check if delivery man has active orders
  const hasActiveOrders = orders.some(order => 
    order.status === 'pending' || order.status === 'ready' || order.status === 'out_for_delivery'
  );

  const fetchData = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      const [activeOrdersResponse, notificationsResponse, historyResponse] = await Promise.all([
        apiService.getDeliveryOrders(), // This gets active orders (ready, out_for_delivery)
        apiService.getDeliveryNotifications(),
        apiService.getDeliveryHistory() // This gets completed orders (delivered)
      ]);
      
      // Set active orders from getDeliveryOrders
      if (activeOrdersResponse.orders) {
        setOrders(activeOrdersResponse.orders);
      } else if (activeOrdersResponse.data) {
        setOrders(activeOrdersResponse.data);
      }
      
      // Set notifications
      if (notificationsResponse.data) {
        setNotifications(notificationsResponse.data);
      }
      
      // Store completed orders separately if needed
      const completedOrders = historyResponse.orders || historyResponse.data || [];
      console.log('Completed orders:', completedOrders.length);
      setCompletedOrders(completedOrders);
      
    } catch (error: any) {
      console.error('Error fetching delivery data:', error);
      toast({
        title: "Error",
        description: "Failed to load delivery data. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.role !== 'delivery') return;
    
    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, [user, toast]);

  // Register WebSocket refresh callback
  useEffect(() => {
    if (user?.role !== 'delivery') return;
    
    const refreshKey = 'delivery-dashboard';
    registerRefreshCallback(refreshKey, () => {
      fetchData(true); // Show refresh indicator
    });

    return () => {
      unregisterRefreshCallback(refreshKey);
    };
  }, [user, registerRefreshCallback, unregisterRefreshCallback]);

  const handleAvailabilityToggle = async (checked: boolean) => {
    await updateAvailability(checked);
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'delivered' && deliveryNotes) {
        updateData.deliveryNotes = deliveryNotes;
      }

      await apiService.updateOrderStatus(orderId, updateData);
      
      // Refresh orders
      const response = await apiService.getDeliveryOrders();
      if (response.orders) {
        setOrders(response.orders);
      } else if (response.data) {
        setOrders(response.data);
      }
      
      setIsStatusDialogOpen(false);
      setSelectedOrder(null);
      setDeliveryNotes('');
      
      // Show appropriate success message based on status
      let successMessage = '';
      if (newStatus === 'out_for_delivery') {
        successMessage = 'Delivery started successfully! You are now on your way to deliver this order.';
      } else if (newStatus === 'delivered') {
        successMessage = 'Order delivered successfully! Thank you for completing this delivery.';
      } else {
        successMessage = `Order status updated to ${newStatus}`;
      }
      
      toast({
        title: "Success",
        description: successMessage,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update order status.",
        variant: "destructive"
      });
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'out_for_delivery': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready': return <Package className="h-4 w-4" />;
      case 'out_for_delivery': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (user?.role !== 'delivery') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You need delivery privileges to access this page.</p>
        </Card>
      </div>
    );
  }

  // Earnings calculations (frontend only)
  const totalEarnings = completedOrders.reduce((sum, order) => sum + order.totalAmount * 0.15, 0);
  const totalDeliveries = completedOrders.length;
  const avgPerDelivery = totalDeliveries > 0 ? totalEarnings / totalDeliveries : 0;

  // Monthly earnings
  const earningsByMonth: { [key: string]: { month: string; total: number; count: number } } = {};
  completedOrders.forEach(order => {
    const date = new Date(order.actualDeliveryTime || order.updatedAt);
    const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    const monthName = date.toLocaleString('default', { year: 'numeric', month: 'long' });
    if (!earningsByMonth[monthKey]) earningsByMonth[monthKey] = { month: monthName, total: 0, count: 0 };
    earningsByMonth[monthKey].total += order.totalAmount * 0.15;
    earningsByMonth[monthKey].count += 1;
  });
  const monthlyEarnings = Object.entries(earningsByMonth)
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([monthKey, data]) => ({ monthKey, ...data }));

  // This already includes 'out_for_delivery' orders in the Active Deliveries section.
  // If you want to make sure, you can add a debug log:
  console.log('Active Orders:', activeOrders.map(o => ({ id: o._id, status: o.status })));

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* --- SECTION 1: Active Orders & Assignments --- */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Delivery Management</h1>
            {isRefreshing && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Updating...</span>
              </div>
            )}
          </div>
          <p className="text-gray-600 mb-6">Manage your active deliveries and assignments</p>
          
          {/* Availability Toggle Section */}
          <div className="mb-8">
            <Card className="bg-gradient-to-r from-italian-green-50 to-italian-cream-50 border-italian-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {isAvailable ? (
                      <Wifi className="h-6 w-6 text-green-600" />
                    ) : (
                      <WifiOff className="h-6 w-6 text-red-600" />
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {isAvailable ? 'Available for Deliveries' : 'Currently Unavailable'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {isAvailable 
                          ? 'You are currently accepting new delivery assignments'
                          : 'You are not accepting new delivery assignments'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Switch
                      checked={isAvailable}
                      onCheckedChange={handleAvailabilityToggle}
                      disabled={updatingAvailability || hasActiveOrders}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {updatingAvailability ? 'Updating...' : (isAvailable ? 'Available' : 'Unavailable')}
                    </span>
                  </div>
                </div>
                {hasActiveOrders && (
                  <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-md">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      <span className="text-sm text-orange-800">
                        You have active deliveries in progress. Complete your current deliveries before going unavailable.
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notifications Section */}
          {notifications.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Bell className="h-5 w-5 mr-2 text-blue-600" />
                New Assignments ({notifications.length})
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {notifications.slice(0, 4).map((notification) => (
                  <Card key={notification._id} className="border-l-4 border-blue-500 bg-blue-50 shadow-lg">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            Order #{notification._id.slice(-6)}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Customer: {notification.user?.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            Address: {notification.deliveryAddress}
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            €{notification.totalAmount.toFixed(2)}
                          </p>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800">
                          {notification.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
          {/* Active Deliveries Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Active Deliveries</h2>
            {activeOrders.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {activeOrders.map((order) => (
                  <Card key={order._id} className="shadow-md">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <span>Order #{order._id.slice(-6)}</span>
                        <Badge className={`${getStatusColor(order.status)} flex items-center gap-1`}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1">{order.status.replace('_', ' ')}</span>
                        </Badge>
                      </CardTitle>
                      {/* Payment Status */}
                      <div className="mt-2">
                        <Badge 
                          variant="outline" 
                          className={`${
                            order.payment?.status === 'paid' 
                              ? 'text-green-600 border-green-600' 
                              : order.payment?.status === 'failed'
                              ? 'text-red-600 border-red-600'
                              : 'text-yellow-600 border-yellow-600'
                          }`}
                        >
                          {order.payment?.paymentMethod === 'cash' ? (
                            <Banknote className="h-3 w-3 mr-1" />
                          ) : (
                            <CreditCard className="h-3 w-3 mr-1" />
                          )}
                          {order.payment?.paymentMethod === 'cash' ? 'Cash' : 'Card'} - {order.payment?.status?.toUpperCase() || 'PENDING'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium">{order.user?.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{order.user?.phone || 'No phone'}</span>
                        </div>
                        <div className="flex items-start space-x-2">
                          <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                          <span className="text-sm text-gray-600">{order.deliveryAddress}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            Total: €{order.totalAmount.toFixed(2)}
                          </span>
                        </div>
                        {order.estimatedDeliveryTime && (
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              Est. Delivery: {new Date(order.estimatedDeliveryTime).toLocaleTimeString('en-US', {
                                hour: '2-digit', minute: '2-digit', hour12: true
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="mt-4 flex space-x-2">
                        {(order.status === 'ready' || order.status === 'pending') && (
                          <Button
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsStatusDialogOpen(true);
                            }}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                          >
                            <Truck className="h-4 w-4 mr-2" />
                            Start Delivery
                          </Button>
                        )}
                        {order.status === 'out_for_delivery' && (
                          <Button
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsStatusDialogOpen(true);
                            }}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark Delivered
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Deliveries</h3>
                  <p className="text-gray-600">You don't have any active delivery assignments at the moment.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Completed Deliveries Section (optional, can be moved or styled differently) */}
        {completedOrders.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Completed Deliveries</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {completedOrders.slice(0, 6).map((order) => (
                <Card key={order._id} className="shadow-md bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">Order #{order._id.slice(-6)}</h3>
                        <p className="text-sm text-gray-600">{order.user?.name}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <p className="text-sm text-gray-600">Order: €{order.totalAmount.toFixed(2)}</p>
                          <p className="text-sm font-semibold text-green-600">
                            Earnings: €{(order.totalAmount * 0.15).toFixed(2)}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(order.actualDeliveryTime || order.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Delivered
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Status Update Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Order #{selectedOrder._id.slice(-6)} - {selectedOrder.user?.name}
                </p>
              </div>
              
              {selectedOrder.status === 'ready' && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Are you ready to start delivery for this order?
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleStatusUpdate(selectedOrder._id, 'out_for_delivery')}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                    >
                      <Truck className="h-4 w-4 mr-2" />
                      Start Delivery
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsStatusDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {selectedOrder.status === 'out_for_delivery' && (
                <div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">
                      Are you sure you want to mark this order as delivered?
                    </p>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Notes (Optional)
                    </label>
                    <Textarea
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                      placeholder="Add any delivery notes, special instructions, or customer feedback..."
                      rows={3}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleStatusUpdate(selectedOrder._id, 'delivered')}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirm Delivery
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsStatusDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DeliveryDashboard; 