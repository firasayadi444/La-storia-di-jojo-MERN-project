import React from 'react';
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

  // --- REVENUE PER MONTH ---
  const revenueByMonth: { [month: string]: { revenue: number; orderCount: number; orders: Order[] } } = {};
  orders.forEach(order => {
    if (order.status === 'delivered') {
      const month = new Date(order.createdAt).toLocaleString('default', { year: 'numeric', month: 'short' });
      if (!revenueByMonth[month]) {
        revenueByMonth[month] = { revenue: 0, orderCount: 0, orders: [] };
      }
      revenueByMonth[month].revenue += order.totalAmount;
      revenueByMonth[month].orderCount += 1;
      revenueByMonth[month].orders.push(order);
    }
  });

  // Sort months chronologically
  const sortedMonths = Object.keys(revenueByMonth).sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateA.getTime() - dateB.getTime();
  });

  const revenueTableData = sortedMonths.map((month, index) => {
    const monthData = revenueByMonth[month];
    const avgOrderValue = monthData.orderCount > 0 ? monthData.revenue / monthData.orderCount : 0;
    const previousMonth = index > 0 ? revenueByMonth[sortedMonths[index - 1]] : null;
    const growthPercentage = previousMonth ? 
      ((monthData.revenue - previousMonth.revenue) / previousMonth.revenue * 100) : 0;

    return {
      month,
      revenue: monthData.revenue,
      orderCount: monthData.orderCount,
      avgOrderValue,
      growthPercentage
    };
  });

  const downloadRevenuePDF = () => {
    const doc = new jsPDF();
    doc.text('Revenue History Per Month', 14, 16);
    const rows = revenueTableData.map(row => [
      row.month, 
      `€${row.revenue.toFixed(2)}`, 
      row.orderCount.toString(),
      `€${row.avgOrderValue.toFixed(2)}`,
      `${row.growthPercentage >= 0 ? '+' : ''}${row.growthPercentage.toFixed(1)}%`
    ]);
    doc.autoTable({ 
      head: [['Month', 'Revenue', 'Orders', 'Avg Order', 'Growth %']], 
      body: rows, 
      startY: 24 
    });
    doc.save('revenue-history.pdf');
  };

  // --- DELIVERY MEN HISTORY & FEEDBACK ---
  const deliveryMenWithOrders = deliveryMen.map(dm => ({
    ...dm,
    deliveredOrders: orders.filter(order => order.deliveryMan?._id === dm._id && order.status === 'delivered'),
  }));
  const selectedDeliveryMan = deliveryMenWithOrders.find(dm => dm._id === selectedDeliveryManId);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading analytics data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* REVENUE PER MONTH SECTION */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Revenue Analytics</h2>
          
          {/* Revenue Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white border rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Revenue</h3>
              <p className="text-2xl font-bold text-gray-900">
                €{revenueTableData.reduce((sum, row) => sum + row.revenue, 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-white border rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Orders</h3>
              <p className="text-2xl font-bold text-gray-900">
                {revenueTableData.reduce((sum, row) => sum + row.orderCount, 0)}
              </p>
            </div>
            <div className="bg-white border rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Average Order Value</h3>
              <p className="text-2xl font-bold text-gray-900">
                €{(revenueTableData.reduce((sum, row) => sum + row.revenue, 0) / 
                   revenueTableData.reduce((sum, row) => sum + row.orderCount, 0) || 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-white border rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Months Tracked</h3>
              <p className="text-2xl font-bold text-gray-900">{revenueTableData.length}</p>
            </div>
          </div>

          {/* Enhanced Revenue Table */}
          <div className="bg-white border rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Revenue Table</h3>
              <button 
                onClick={downloadRevenuePDF} 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Order</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Growth</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {revenueTableData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500">
                        No revenue data available.
                      </td>
                    </tr>
                  ) : revenueTableData.map((row, index) => (
                    <tr key={row.month} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {row.month}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                        €{row.revenue.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.orderCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        €{row.avgOrderValue.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {index === 0 ? (
                          <span className="text-gray-500">-</span>
                        ) : (
                          <span className={`font-medium ${row.growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {row.growthPercentage >= 0 ? '+' : ''}{row.growthPercentage.toFixed(1)}%
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* DELIVERY MEN HISTORY & FEEDBACK SECTION */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Delivery Men: Delivered Orders & Feedback</h2>
          <div className="mb-4">
            <label className="font-medium mr-2">Select Delivery Man:</label>
            <select 
              value={selectedDeliveryManId} 
              onChange={e => setSelectedDeliveryManId(e.target.value)} 
              className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select --</option>
              {deliveryMenWithOrders.map(dm => (
                <option key={dm._id} value={dm._id}>{dm.name}</option>
              ))}
            </select>
          </div>
          {selectedDeliveryMan ? (
            <div className="bg-white border rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Delivered Orders for {selectedDeliveryMan.name}</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Rating</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feedback</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedDeliveryMan.deliveredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-gray-500">
                          No delivered orders for this delivery man.
                        </td>
                      </tr>
                    ) : selectedDeliveryMan.deliveredOrders.map(order => (
                      <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order._id.slice(-6)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.user?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.actualDeliveryTime ? new Date(order.actualDeliveryTime).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.deliveryRating ? '⭐'.repeat(order.deliveryRating) : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title={order.feedbackComment}>
                          {order.feedbackComment || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white border rounded-lg shadow p-6">
              <p className="text-gray-500 text-center">Select a delivery man to view their delivered orders and feedback.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics; 