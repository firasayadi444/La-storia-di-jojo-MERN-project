import React, { useEffect, useState } from 'react';
import { apiService, Order, User } from '../services/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, User as UserIcon, Truck, Package, CheckCircle, XCircle, AlertCircle, RefreshCw, MapPin } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';

const statusOptions = [
  'pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'
];

// Helper for countdown
function getCountdown(assignedAt: string | undefined) {
  if (!assignedAt) return { min: 10, sec: 0, expired: false };
  const assigned = new Date(assignedAt).getTime();
  const now = Date.now();
  const diff = 10 * 60 * 1000 - (now - assigned); // 10 min in ms
  if (diff <= 0) return { min: 0, sec: 0, expired: true };
  const min = Math.floor(diff / 60000);
  const sec = Math.floor((diff % 60000) / 1000);
  return { min, sec, expired: false };
}

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryMen, setDeliveryMen] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [updateData, setUpdateData] = useState({
    status: '',
    deliveryManId: '',
    estimatedDeliveryTime: '',
    deliveryNotes: ''
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { registerRefreshCallback, unregisterRefreshCallback } = useSocket();

  const fetchOrders = async (showRefreshIndicator = false) => {
    console.log('📡 Admin dashboard fetchOrders called, showRefreshIndicator:', showRefreshIndicator);
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const res = await apiService.getAllOrders();
      console.log('📡 Admin dashboard fetchOrders response:', res);
      const newOrders = res.orders || res.data || [];
      console.log('📡 Admin dashboard orders count:', newOrders.length);
      console.log('📡 Admin dashboard orders statuses:', newOrders.map(o => ({ id: o._id, status: o.status })));
      setOrders(newOrders);
    } catch (e) {
      console.error('📡 Admin dashboard fetchOrders error:', e);
      setOrders([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchDeliveryMen = async () => {
    try {
      const res = await apiService.getAvailableDeliveryMen();
      setDeliveryMen((res as any).deliveryMen || res.data || []);
    } catch (e) {
      setDeliveryMen([]);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchDeliveryMen();
  }, []);

  // Register WebSocket refresh callback
  useEffect(() => {
    const refreshKey = 'admin-orders';
    console.log('📝 Admin dashboard registering refresh callback:', refreshKey);
    registerRefreshCallback(refreshKey, () => {
      console.log('🔄 Admin dashboard refresh callback triggered');
      fetchOrders(true); // Show refresh indicator
    });

    return () => {
      console.log('📝 Admin dashboard unregistering refresh callback:', refreshKey);
      unregisterRefreshCallback(refreshKey);
    };
  }, [registerRefreshCallback, unregisterRefreshCallback]);

  // Track orders changes for debugging
  useEffect(() => {
    console.log('📊 Admin dashboard orders updated:', {
      total: orders.length,
      active: orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      delivered: orders.filter(o => o.status === 'delivered').length
    });
  }, [orders]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'preparing': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'ready': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'out_for_delivery': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'confirmed': return <AlertCircle className="h-4 w-4" />;
      case 'preparing': return <Package className="h-4 w-4" />;
      case 'ready': return <Package className="h-4 w-4" />;
      case 'out_for_delivery': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const isNewOrder = (order: Order) => {
    const orderDate = new Date(order.createdAt);
    const now = new Date();
    const diffInHours = (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60);
    return diffInHours < 24; // New if less than 24 hours old
  };

  const sortedOrders = [...orders]
    .filter(order => order.status !== 'delivered' && order.status !== 'cancelled')
    .sort((a, b) => {
      // New orders first
      if (isNewOrder(a) && !isNewOrder(b)) return -1;
      if (!isNewOrder(a) && isNewOrder(b)) return 1;
      // Then by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const openUpdateDialog = (order: Order) => {
    setSelectedOrder(order);
    setUpdateData({
      status: order.status,
      deliveryManId: order.deliveryMan?._id || '',
      estimatedDeliveryTime: order.estimatedDeliveryTime ? 
        new Date(order.estimatedDeliveryTime).toTimeString().slice(0, 5) : '',
      deliveryNotes: ''
    });
    setIsDialogOpen(true);
  };

  const handleUpdateOrder = async () => {
    if (!selectedOrder) return;
    
    // Don't update if status hasn't changed and no other fields are being updated
    if (updateData.status === selectedOrder.status && 
        !updateData.deliveryManId && 
        !updateData.estimatedDeliveryTime && 
        !updateData.deliveryNotes) {
      setIsDialogOpen(false);
      return;
    }
    
    setUpdating(selectedOrder._id);
    try {
      const updatePayload: any = { status: updateData.status };
      
      if (updateData.deliveryManId) {
        updatePayload.deliveryManId = updateData.deliveryManId;
      }
      if (updateData.estimatedDeliveryTime) {
        // Convert time-only input to full datetime (today's date + selected time)
        const today = new Date();
        const [hours, minutes] = updateData.estimatedDeliveryTime.split(':');
        const estimatedDateTime = new Date(today);
        estimatedDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        updatePayload.estimatedDeliveryTime = estimatedDateTime;
      }
      if (updateData.deliveryNotes) {
        updatePayload.deliveryNotes = updateData.deliveryNotes;
      }

      await apiService.updateOrderStatus(selectedOrder._id, updatePayload);
      fetchOrders();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error updating order:', error);
    }
    setUpdating(null);
  };

  const getOrderStats = () => {
    // Only count active orders (excluding delivered and cancelled)
    const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
    const stats = {
      total: activeOrders.length,
      pending: activeOrders.filter(o => o.status === 'pending').length,
      preparing: activeOrders.filter(o => o.status === 'preparing').length,
      ready: activeOrders.filter(o => o.status === 'ready').length,
      out_for_delivery: activeOrders.filter(o => o.status === 'out_for_delivery').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      new: activeOrders.filter(o => isNewOrder(o)).length
    };
    return stats;
  };

  const stats = getOrderStats();

  // OrderCard component for each order (fixes hooks-in-loop)
  const OrderCard: React.FC<{
    order: Order;
    isNew: boolean;
    deliveryMen: User[];
    updating: string | null;
    openUpdateDialog: (order: Order) => void;
  }> = ({ order, isNew, deliveryMen, updating, openUpdateDialog }) => {
    // Timer logic for assigned orders
    const showTimer = order.status === 'ready' && order.deliveryMan && order.assignedAt;
    const [timer, setTimer] = useState(() => getCountdown(order.assignedAt));
    useEffect(() => {
      if (!showTimer) return;
      const interval = setInterval(() => {
        setTimer(getCountdown(order.assignedAt));
      }, 1000);
      return () => clearInterval(interval);
    }, [order.assignedAt, showTimer]);

    return (
      <Card
        key={order._id}
        className={`shadow-lg hover:shadow-xl transition-all duration-200 ${
          isNew ? 'border-l-4 border-yellow-500 bg-yellow-50' : ''
        } ${showTimer && timer.expired && order.status !== 'out_for_delivery' ? 'border-l-8 border-red-600 bg-red-50 animate-pulse' : ''}`}
      >
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  Order #{order._id.slice(-6)}
                </h3>
                {isNew && (
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    NEW
                  </Badge>
                )}
                <Badge className={`${getStatusColor(order.status)} flex items-center gap-1`}>
                  {getStatusIcon(order.status)}
                  {order.status.replace('_', ' ')}
                </Badge>
                {showTimer && (
                  <span className="ml-2 flex items-center gap-1 text-xs font-mono">
                    <Clock className="h-4 w-4 text-purple-500" />
                    {timer.expired && order.status !== 'out_for_delivery' ? (
                      <span className="text-red-600 font-bold">Needs Attention!</span>
                    ) : (
                      <span>{String(timer.min).padStart(2, '0')}:{String(timer.sec).padStart(2, '0')}</span>
                    )}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">{order.user?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">
                    {order.deliveryMan?.name || 'Not assigned'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">
                    €{order.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {new Date(order.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => openUpdateDialog(order)}
                disabled={updating === order._id}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updating === order._id ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Orders Management</h1>
          <p className="text-gray-600">Manage and track all customer orders</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm opacity-90">Total Orders</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.new}</p>
                <p className="text-sm opacity-90">New Today</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm opacity-90">Pending</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.ready}</p>
                <p className="text-sm opacity-90">Ready</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.preparing}</p>
                <p className="text-sm opacity-90">Preparing</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.delivered}</p>
                <p className="text-sm opacity-90">Delivered (History)</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.cancelled}</p>
                <p className="text-sm opacity-90">Cancelled (History)</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Orders List */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold text-gray-800">Active Orders</h2>
            {isRefreshing && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Updating...</span>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-600">Showing only pending, confirmed, preparing, ready, and out for delivery orders. Delivered and cancelled orders are shown in the history section.</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading orders...</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {sortedOrders.map(order => (
              <OrderCard
                key={order._id}
                order={order}
                isNew={isNewOrder(order)}
                deliveryMen={deliveryMen}
                updating={updating}
                openUpdateDialog={openUpdateDialog}
              />
            ))}
          </div>
        )}

        {!loading && sortedOrders.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Orders Found</h3>
              <p className="text-gray-600">There are no orders to display at the moment.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Update the order status and assign delivery details.
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div>
                <Label>Order ID: {selectedOrder._id.slice(-6)}</Label>
              </div>
              
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={updateData.status}
                  onValueChange={(value) => setUpdateData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {updateData.status === 'ready' && (
                <div>
                  <Label htmlFor="deliveryMan">Assign Delivery Man</Label>
                  <Select
                    value={updateData.deliveryManId}
                    onValueChange={(value) => setUpdateData(prev => ({ ...prev, deliveryManId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select delivery man" />
                    </SelectTrigger>
                    <SelectContent>
                      {deliveryMen.map((deliveryMan) => (
                        <SelectItem key={deliveryMan._id} value={deliveryMan._id}>
                          {deliveryMan.name} {deliveryMan.phone && `(${deliveryMan.phone})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {updateData.status === 'out_for_delivery' && (
                <>
                  <div>
                    <Label htmlFor="deliveryMan">Assign Delivery Man</Label>
                    <Select
                      value={updateData.deliveryManId}
                      onValueChange={(value) => setUpdateData(prev => ({ ...prev, deliveryManId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select delivery man" />
                      </SelectTrigger>
                      <SelectContent>
                        {deliveryMen.map((deliveryMan) => (
                          <SelectItem key={deliveryMan._id} value={deliveryMan._id}>
                            {deliveryMan.name} {deliveryMan.phone && `(${deliveryMan.phone})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="estimatedTime">Estimated Delivery Time</Label>
                    <Input
                      id="estimatedTime"
                      type="time"
                      value={updateData.estimatedDeliveryTime}
                      onChange={(e) => setUpdateData(prev => ({ 
                        ...prev, 
                        estimatedDeliveryTime: e.target.value 
                      }))}
                    />
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="notes">Delivery Notes</Label>
                <Input
                  id="notes"
                  value={updateData.deliveryNotes}
                  onChange={(e) => setUpdateData(prev => ({ 
                    ...prev, 
                    deliveryNotes: e.target.value 
                  }))}
                  placeholder="Optional delivery notes..."
                />
              </div>

              <div className="flex space-x-2">
                <Button 
                  onClick={handleUpdateOrder}
                  disabled={updating === selectedOrder._id}
                  className="flex-1"
                >
                  {updating === selectedOrder._id ? 'Updating...' : 'Update Order'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default AdminOrders; 