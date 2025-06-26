import React, { useEffect, useState } from 'react';
import { apiService, Order } from '../services/api';
import { Button } from '@/components/ui/button';

const statusOptions = [
  'pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'
];

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await apiService.getAllOrders();
      setOrders(res.orders || res.data || []);
    } catch (e) {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleStatusChange = async (orderId: string, status: string) => {
    setUpdating(orderId);
    try {
      await apiService.updateOrderStatus(orderId, { status });
      fetchOrders();
    } catch {}
    setUpdating(null);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Orders Management</h1>
      {loading ? <div>Loading...</div> : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded shadow">
            <thead>
              <tr>
                <th className="px-4 py-2 border">Order ID</th>
                <th className="px-4 py-2 border">User</th>
                <th className="px-4 py-2 border">Delivery Man</th>
                <th className="px-4 py-2 border">Total</th>
                <th className="px-4 py-2 border">Status</th>
                <th className="px-4 py-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order._id} className="border-b">
                  <td className="px-4 py-2 border">{order._id.slice(-6)}</td>
                  <td className="px-4 py-2 border">{order.user?.name}</td>
                  <td className="px-4 py-2 border">{order.deliveryMan?.name || '-'}</td>
                  <td className="px-4 py-2 border">€{order.totalAmount.toFixed(2)}</td>
                  <td className="px-4 py-2 border capitalize">{order.status}</td>
                  <td className="px-4 py-2 border space-x-2">
                    <select
                      value={order.status}
                      onChange={e => handleStatusChange(order._id, e.target.value)}
                      disabled={updating === order._id}
                      className="border rounded px-2 py-1"
                    >
                      {statusOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
export default AdminOrders; 