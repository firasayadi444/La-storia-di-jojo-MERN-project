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
  Navigation
} from 'lucide-react';

const DeliveryDashboard: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (user?.role !== 'delivery') return;
    
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await apiService.getDeliveryOrders();
        if (response.orders) {
          setOrders(response.orders);
        } else if (response.data) {
          setOrders(response.data);
        }
      } catch (error: any) {
        console.error('Error fetching delivery orders:', error);
        toast({
          title: "Error",
          description: "Failed to load delivery orders. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
    // Refresh every 30 seconds
    const interval = setInterval(fetchOrders, 30000);
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
      case 'ready': return 'bg-green-100 text-green-800';
      case 'out_for_delivery': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready': return <Package className="h-4 w-4" />;
      case 'out_for_delivery': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Delivery Dashboard</h1>
          <p className="text-gray-600">Manage your delivery assignments</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-primary text-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Active Deliveries</p>
                  <p className="text-2xl font-bold">{activeOrders.length}</p>
                </div>
                <Truck className="h-8 w-8 text-white/80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-secondary text-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Completed Today</p>
                  <p className="text-2xl font-bold">{completedOrders.length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-white/80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-2 border-food-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Ready for Pickup</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {orders.filter(o => o.status === 'ready').length}
                  </p>
                </div>
                <Package className="h-8 w-8 text-food-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Deliveries */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Active Deliveries</h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-food-orange-600 mx-auto mb-4"></div>
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
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1">{order.status.replace('_', ' ')}</span>
                          </Badge>
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(order.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-food-orange-600">€{order.totalAmount.toFixed(2)}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Customer Info */}
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Customer Details
                      </h4>
                      <p className="text-sm text-gray-700">{order.user.name}</p>
                      <p className="text-sm text-gray-600">{order.user.email}</p>
                      {order.user.phone && (
                        <p className="text-sm text-gray-600 flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {order.user.phone}
                        </p>
                      )}
                    </div>

                    {/* Delivery Address */}
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        Delivery Address
                      </h4>
                      <p className="text-sm text-gray-700">{order.deliveryAddress}</p>
                    </div>

                    {/* Order Items */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Order Items</h4>
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{item.food.name} x{item.quantity}</span>
                            <span className="text-gray-600">€{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2 pt-4">
                      {order.status === 'ready' && (
                        <Button
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsStatusDialogOpen(true);
                          }}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
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
                      
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsStatusDialogOpen(true);
                        }}
                      >
                        <Navigation className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No active deliveries</h3>
              <p className="text-gray-600">Orders ready for delivery will appear here!</p>
            </Card>
          )}
        </div>

        {/* Status Update Dialog */}
        <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Update Order Status</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Order #{selectedOrder._id.slice(-6)}</h4>
                  <p className="text-sm text-gray-600">
                    Current Status: <Badge className={getStatusColor(selectedOrder.status)}>
                      {selectedOrder.status.replace('_', ' ')}
                    </Badge>
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
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
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
                    <p className="text-sm text-gray-600 mb-2">
                      Has this order been delivered successfully?
                    </p>
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Add delivery notes (optional)..."
                        value={deliveryNotes}
                        onChange={(e) => setDeliveryNotes(e.target.value)}
                        rows={3}
                      />
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleStatusUpdate(selectedOrder._id, 'delivered')}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark Delivered
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsStatusDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default DeliveryDashboard; 