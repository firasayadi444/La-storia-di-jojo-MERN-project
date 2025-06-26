import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService, Order } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
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
  Calendar
} from 'lucide-react';

const DeliveryDashboard: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (user?.role !== 'delivery') return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const [historyResponse, notificationsResponse] = await Promise.all([
          apiService.getDeliveryHistory(),
          apiService.getDeliveryNotifications()
        ]);
        if (historyResponse.orders) {
          setOrders(historyResponse.orders);
        } else if (historyResponse.data) {
          setOrders(historyResponse.data);
        }
        if (notificationsResponse.data) {
          setNotifications(notificationsResponse.data);
        }
      } catch (error: any) {
        console.error('Error fetching delivery data:', error);
        toast({
          title: "Error",
          description: "Failed to load delivery data. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [user, toast]);

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
      
      toast({
        title: "Success",
        description: `Order status updated to ${newStatus}`,
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

  const activeOrders = orders.filter(order => order.status === 'ready' || order.status === 'out_for_delivery');
  const completedOrders = orders.filter(order => order.status === 'delivered');

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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Delivery Management</h1>
          <p className="text-gray-600">Manage your active deliveries and assignments</p>
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Total Earnings</p>
                  <p className="text-2xl font-bold">€{totalEarnings.toFixed(2)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-white/80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Total Deliveries</p>
                  <p className="text-2xl font-bold">{totalDeliveries}</p>
                </div>
                <Truck className="h-8 w-8 text-white/80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Avg. Per Delivery</p>
                  <p className="text-2xl font-bold">
                    €{avgPerDelivery.toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-white/80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Months Active</p>
                  <p className="text-2xl font-bold">{monthlyEarnings.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-white/80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Earnings Table */}
        {monthlyEarnings.length > 0 && (
          <Card className="shadow-lg mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Monthly Earnings History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deliveries</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Earnings</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Per Delivery</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {monthlyEarnings.map(month => (
                      <tr key={month.monthKey} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {month.month}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {month.count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          €{month.total.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          €{(month.total / month.count).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Deliveries */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Active Deliveries</h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading deliveries...</p>
            </div>
          ) : activeOrders.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {activeOrders.map((order) => (
                <Card key={order._id} className="shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <span>Order #{order._id.slice(-6)}</span>
                          <Badge className={`${getStatusColor(order.status)} flex items-center gap-1`}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1">{order.status.replace('_', ' ')}</span>
                          </Badge>
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(order.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
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
                            Est. Delivery: {new Date(order.estimatedDeliveryTime).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 flex space-x-2">
                      {order.status === 'ready' && (
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

        {/* Completed Deliveries */}
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Notes (Optional)
                    </label>
                    <Textarea
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                      placeholder="Add any delivery notes..."
                      rows={3}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleStatusUpdate(selectedOrder._id, 'delivered')}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Delivered
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