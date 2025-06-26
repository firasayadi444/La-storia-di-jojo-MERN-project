import React from 'react';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useAuth } from '../contexts/AuthContext';
import { apiService, Order, User } from '../services/api';

const AdminAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [deliveryMen, setDeliveryMen] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedDeliveryManId, setSelectedDeliveryManId] = React.useState('');

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [ordersRes, deliveryMenRes] = await Promise.all([
        apiService.getAllOrders(),
        apiService.getAvailableDeliveryMen(),
      ]);
      setOrders(ordersRes.orders || ordersRes.data || []);
      setDeliveryMen(deliveryMenRes.deliveryMen || deliveryMenRes.data || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  // --- FEEDBACK & CHART SECTION ---
  const feedbackOrders = orders.filter(order => order.status === 'delivered' && (order.foodRating || order.deliveryRating || order.feedbackComment));
  const feedbackByMonth: { [month: string]: { foodRatings: number[]; deliveryRatings: number[] } } = {};
  feedbackOrders.forEach(order => {
    const month = new Date(order.createdAt).toLocaleString('default', { year: 'numeric', month: 'short' });
    if (!feedbackByMonth[month]) feedbackByMonth[month] = { foodRatings: [], deliveryRatings: [] };
    if (order.foodRating) feedbackByMonth[month].foodRatings.push(order.foodRating);
    if (order.deliveryRating) feedbackByMonth[month].deliveryRatings.push(order.deliveryRating);
  });
  const chartData = Object.entries(feedbackByMonth).map(([month, ratings]) => ({
    month,
    avgFood: ratings.foodRatings.length ? (ratings.foodRatings.reduce((a, b) => a + b, 0) / ratings.foodRatings.length) : null,
    avgDelivery: ratings.deliveryRatings.length ? (ratings.deliveryRatings.reduce((a, b) => a + b, 0) / ratings.deliveryRatings.length) : null,
  }));

  // --- REVENUE PER MONTH ---
  const revenueByMonth: { [month: string]: number } = {};
  orders.forEach(order => {
    if (order.status === 'delivered') {
      const month = new Date(order.createdAt).toLocaleString('default', { year: 'numeric', month: 'short' });
      if (!revenueByMonth[month]) revenueByMonth[month] = 0;
      revenueByMonth[month] += order.totalAmount;
    }
  });
  const revenueChartData = Object.entries(revenueByMonth).map(([month, revenue]) => ({ month, revenue }));
  const downloadRevenuePDF = () => {
    const doc = new jsPDF();
    doc.text('Revenue History Per Month', 14, 16);
    const rows = Object.entries(revenueByMonth).map(([month, revenue]) => [month, `€${revenue.toFixed(2)}`]);
    doc.autoTable({ head: [['Month', 'Revenue']], body: rows, startY: 24 });
    doc.save('revenue-history.pdf');
  };

  // --- DELIVERY MEN HISTORY & FEEDBACK ---
  const deliveryMenWithOrders = deliveryMen.map(dm => ({
    ...dm,
    deliveredOrders: orders.filter(order => order.deliveryMan?._id === dm._id && order.status === 'delivered'),
  }));
  const selectedDeliveryMan = deliveryMenWithOrders.find(dm => dm._id === selectedDeliveryManId);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* REVENUE PER MONTH SECTION */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Revenue Per Month</h2>
          <div className="bg-white border rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Revenue Chart</h3>
            {revenueChartData.length === 0 ? (
              <div className="text-gray-500 text-center py-8">No revenue data to display.</div>
            ) : (
              <ChartContainer config={{ revenue: { color: '#3b82f6' } }}>
                <LineChart data={revenueChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" strokeWidth={2} dot />
                </LineChart>
              </ChartContainer>
            )}
          </div>
          <div className="bg-white border rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">Revenue Table
              <button onClick={downloadRevenuePDF} className="ml-4 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Download PDF</button>
            </h3>
            <table className="min-w-full bg-white border rounded-lg shadow">
              <thead>
                <tr>
                  <th className="px-4 py-2 border-b">Month</th>
                  <th className="px-4 py-2 border-b">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {revenueChartData.length === 0 ? (
                  <tr><td colSpan={2} className="text-center py-6 text-gray-500">No revenue data.</td></tr>
                ) : revenueChartData.map(row => (
                  <tr key={row.month} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{row.month}</td>
                    <td className="px-4 py-2">€{row.revenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* FEEDBACK & ANALYTICS SECTION */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Customer Feedback & Analytics</h2>
          {/* Feedback Table */}
          <div className="overflow-x-auto mb-8">
            <table className="min-w-full bg-white border rounded-lg shadow">
              <thead>
                <tr>
                  <th className="px-4 py-2 border-b">Order</th>
                  <th className="px-4 py-2 border-b">Customer</th>
                  <th className="px-4 py-2 border-b">Food Rating</th>
                  <th className="px-4 py-2 border-b">Delivery Rating</th>
                  <th className="px-4 py-2 border-b">Comment</th>
                  <th className="px-4 py-2 border-b">Date</th>
                </tr>
              </thead>
              <tbody>
                {feedbackOrders.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-6 text-gray-500">No feedback yet.</td></tr>
                ) : feedbackOrders.map(order => (
                  <tr key={order._id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{order._id.slice(-6)}</td>
                    <td className="px-4 py-2">{order.user?.name || 'N/A'}</td>
                    <td className="px-4 py-2 text-center">{order.foodRating ? '⭐'.repeat(order.foodRating) : '-'}</td>
                    <td className="px-4 py-2 text-center">{order.deliveryRating ? '⭐'.repeat(order.deliveryRating) : '-'}</td>
                    <td className="px-4 py-2 max-w-xs truncate" title={order.feedbackComment}>{order.feedbackComment || '-'}</td>
                    <td className="px-4 py-2">{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Feedback Chart */}
          <div className="bg-white border rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Average Ratings Per Month</h3>
            {chartData.length === 0 ? (
              <div className="text-gray-500 text-center py-8">No feedback data to display.</div>
            ) : (
              <ChartContainer config={{ food: { color: '#f59e42' }, delivery: { color: '#22c55e' } }}>
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 5]} ticks={[1,2,3,4,5]} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line type="monotone" dataKey="avgFood" name="Food Rating" stroke="#f59e42" strokeWidth={2} dot />
                  <Line type="monotone" dataKey="avgDelivery" name="Delivery Rating" stroke="#22c55e" strokeWidth={2} dot />
                </LineChart>
              </ChartContainer>
            )}
          </div>
        </div>
        {/* DELIVERY MEN HISTORY & FEEDBACK SECTION */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Delivery Men: Delivered Orders & Feedback</h2>
          <div className="mb-4">
            <label className="font-medium mr-2">Select Delivery Man:</label>
            <select value={selectedDeliveryManId} onChange={e => setSelectedDeliveryManId(e.target.value)} className="border rounded px-2 py-1">
              <option value="">-- Select --</option>
              {deliveryMenWithOrders.map(dm => (
                <option key={dm._id} value={dm._id}>{dm.name}</option>
              ))}
            </select>
          </div>
          {selectedDeliveryMan ? (
            <div className="bg-white border rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Delivered Orders for {selectedDeliveryMan.name}</h3>
              <table className="min-w-full bg-white border rounded-lg shadow">
                <thead>
                  <tr>
                    <th className="px-4 py-2 border-b">Order</th>
                    <th className="px-4 py-2 border-b">Customer</th>
                    <th className="px-4 py-2 border-b">Delivery Date</th>
                    <th className="px-4 py-2 border-b">Delivery Rating</th>
                    <th className="px-4 py-2 border-b">Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedDeliveryMan.deliveredOrders.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-6 text-gray-500">No delivered orders.</td></tr>
                  ) : selectedDeliveryMan.deliveredOrders.map(order => (
                    <tr key={order._id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">{order._id.slice(-6)}</td>
                      <td className="px-4 py-2">{order.user?.name || 'N/A'}</td>
                      <td className="px-4 py-2">{order.actualDeliveryTime ? new Date(order.actualDeliveryTime).toLocaleDateString() : '-'}</td>
                      <td className="px-4 py-2 text-center">{order.deliveryRating ? '⭐'.repeat(order.deliveryRating) : '-'}</td>
                      <td className="px-4 py-2 max-w-xs truncate" title={order.feedbackComment}>{order.feedbackComment || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-gray-500">Select a delivery man to view their delivered orders and feedback.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics; 