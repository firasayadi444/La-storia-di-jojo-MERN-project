import React, { useEffect, useState } from 'react';
import { apiService, Order, User } from '../services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User as UserIcon, Truck, Inbox, CheckCircle } from 'lucide-react';

const AdminOrdersHistory: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrderHistory = async () => {
    setLoading(true);
    try {
      const res = await apiService.getAllOrders();
      // Filter for delivered or cancelled
      const filtered = (res.orders || res.data || []).filter(
        (order: Order) => order.status === 'delivered' || order.status === 'cancelled'
      );
      // Sort by date, most recent first
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(filtered);
    } catch (e) {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderHistory();
  }, []);

  // Metrics
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;
  const cancelledCount = orders.filter(o => o.status === 'cancelled').length;
  // Group by month
  const ordersByMonth: { [month: string]: { delivered: number; cancelled: number } } = {};
  orders.forEach(order => {
    const month = new Date(order.createdAt).toLocaleString('default', { year: 'numeric', month: 'short' });
    if (!ordersByMonth[month]) ordersByMonth[month] = { delivered: 0, cancelled: 0 };
    if (order.status === 'delivered') ordersByMonth[month].delivered++;
    if (order.status === 'cancelled') ordersByMonth[month].cancelled++;
  });

  // Remove Monthly Summary section and add month filter
  const months = Array.from(new Set(orders.map(order => new Date(order.createdAt).toLocaleString('default', { year: 'numeric', month: 'short' }))));
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const filteredOrders = selectedMonth
    ? orders.filter(order => new Date(order.createdAt).toLocaleString('default', { year: 'numeric', month: 'short' }) === selectedMonth)
    : orders;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order History</h1>
          <p className="text-gray-600">All delivered and cancelled orders, listed by date</p>
          <div className="mt-4 flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Filter by Month:</label>
            <select
              className="border rounded px-3 py-1 text-sm"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
            >
              <option value="">All</option>
              {months.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>
        </div>
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading order history...</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredOrders.map(order => (
              <Card key={order._id} className={`shadow-lg hover:shadow-xl transition-all duration-200 border-l-4 ${order.status === 'delivered' ? 'border-green-500 bg-green-50' : 'border-red-400 bg-red-50'}`}>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Order #{order._id.slice(-6)}
                        </h3>
                        <Badge className={`${order.status === 'delivered' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'} flex items-center gap-1`}>
                          {order.status === 'delivered' ? <CheckCircle className="h-4 w-4" /> : <Inbox className="h-4 w-4" />}
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
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
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {!loading && orders.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Inbox className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Orders Found</h3>
              <p className="text-gray-600">There are no orders to display at the moment.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminOrdersHistory; 