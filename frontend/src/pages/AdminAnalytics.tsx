import React from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useAuth } from '../contexts/AuthContext';
import { apiService, Order, User } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Users, 
  Calendar,
  Download,
  Star,
  Truck,
  BarChart3,
  Target,
  Award
} from 'lucide-react';

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
          <div className="flex items-center space-x-3 mb-6">
            <BarChart3 className="h-8 w-8 text-italian-green-600" />
            <h2 className="text-3xl font-bold text-gray-900">Revenue Analytics</h2>
          </div>
          
          {/* Revenue Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm font-medium mb-1">Total Revenue</p>
                    <p className="text-3xl font-bold">
                      €{revenueTableData.reduce((sum, row) => sum + row.revenue, 0).toFixed(2)}
                    </p>
                    <p className="text-white/70 text-xs mt-1">All time earnings</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-full">
                    <DollarSign className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm font-medium mb-1">Total Orders</p>
                    <p className="text-3xl font-bold">
                      {revenueTableData.reduce((sum, row) => sum + row.orderCount, 0)}
                    </p>
                    <p className="text-white/70 text-xs mt-1">Delivered orders</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-full">
                    <Package className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm font-medium mb-1">Average Order</p>
                    <p className="text-3xl font-bold">
                      €{(revenueTableData.reduce((sum, row) => sum + row.revenue, 0) / 
                         revenueTableData.reduce((sum, row) => sum + row.orderCount, 0) || 0).toFixed(2)}
                    </p>
                    <p className="text-white/70 text-xs mt-1">Per delivery</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-full">
                    <Target className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm font-medium mb-1">Months Tracked</p>
                    <p className="text-3xl font-bold">{revenueTableData.length}</p>
                    <p className="text-white/70 text-xs mt-1">Data period</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-full">
                    <Calendar className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Revenue Table */}
          <Card className="shadow-lg mb-8">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="h-6 w-6 text-italian-green-600" />
                  <CardTitle className="text-xl font-bold text-gray-900">Monthly Revenue Performance</CardTitle>
                </div>
                <Button 
                  onClick={downloadRevenuePDF} 
                  className="bg-italian-green-600 hover:bg-italian-green-700 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-italian-green-50 to-italian-cream-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>Month</span>
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4" />
                          <span>Revenue</span>
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center space-x-2">
                          <Package className="h-4 w-4" />
                          <span>Orders</span>
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center space-x-2">
                          <Target className="h-4 w-4" />
                          <span>Avg Order</span>
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4" />
                          <span>Growth</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {revenueTableData.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12">
                          <div className="flex flex-col items-center space-y-3">
                            <BarChart3 className="h-12 w-12 text-gray-400" />
                            <p className="text-gray-500 text-lg font-medium">No revenue data available</p>
                            <p className="text-gray-400 text-sm">Complete your first order to start tracking revenue</p>
                          </div>
                        </td>
                      </tr>
                    ) : revenueTableData.map((row, index) => (
                      <tr key={row.month} className="hover:bg-gray-50 transition-all duration-200 group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-italian-green-100 rounded-full flex items-center justify-center">
                              <span className="text-italian-green-700 font-semibold text-sm">
                                {new Date(row.month).getMonth() + 1}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{row.month}</p>
                              <p className="text-xs text-gray-500">{new Date(row.month).getFullYear()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold text-gray-900">€{row.revenue.toFixed(2)}</span>
                            <Badge variant="secondary" className="text-xs">
                              {row.orderCount} orders
                            </Badge>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <Package className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-gray-900">{row.orderCount}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <Target className="h-4 w-4 text-purple-600" />
                            <span className="text-sm font-medium text-gray-900">€{row.avgOrderValue.toFixed(2)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {index === 0 ? (
                            <Badge variant="outline" className="text-gray-500">
                              First Month
                            </Badge>
                          ) : (
                            <div className="flex items-center space-x-2">
                              {row.growthPercentage >= 0 ? (
                                <TrendingUp className="h-4 w-4 text-green-600" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-600" />
                              )}
                              <Badge 
                                variant={row.growthPercentage >= 0 ? "default" : "destructive"}
                                className="font-medium"
                              >
                                {row.growthPercentage >= 0 ? '+' : ''}{row.growthPercentage.toFixed(1)}%
                              </Badge>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* DELIVERY MEN HISTORY & FEEDBACK SECTION */}
        <div className="mt-12">
          <div className="flex items-center space-x-3 mb-6">
            <Truck className="h-8 w-8 text-italian-green-600" />
            <h2 className="text-3xl font-bold text-gray-900">Delivery Performance Analytics</h2>
          </div>
          
          <Card className="shadow-lg mb-6">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Users className="h-6 w-6 text-italian-green-600" />
                  <CardTitle className="text-xl font-bold text-gray-900">Delivery Men Performance</CardTitle>
                </div>
                <div className="flex items-center space-x-3">
                  <label className="text-sm font-medium text-gray-700">Select Delivery Man:</label>
                  <select 
                    value={selectedDeliveryManId} 
                    onChange={e => setSelectedDeliveryManId(e.target.value)} 
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-italian-green-500 focus:border-italian-green-500 bg-white shadow-sm"
                  >
                    <option value="">-- Select Delivery Man --</option>
                    {deliveryMenWithOrders.map(dm => (
                      <option key={dm._id} value={dm._id}>
                        {dm.name} ({dm.deliveredOrders.length} deliveries)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {selectedDeliveryMan ? (
                <div className="p-6">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-italian-green-500 to-italian-green-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {selectedDeliveryMan.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{selectedDeliveryMan.name}</h3>
                      <p className="text-gray-600">
                        {selectedDeliveryMan.deliveredOrders.length} delivered orders
                      </p>
                    </div>
                    <div className="ml-auto flex items-center space-x-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-italian-green-600">
                          {selectedDeliveryMan.deliveredOrders.length}
                        </p>
                        <p className="text-sm text-gray-500">Total Deliveries</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">
                          {selectedDeliveryMan.deliveredOrders.reduce((sum, order) => sum + (order.deliveryRating || 0), 0) / 
                           selectedDeliveryMan.deliveredOrders.filter(order => order.deliveryRating).length || 0}
                        </p>
                        <p className="text-sm text-gray-500">Avg Rating</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                            <div className="flex items-center space-x-2">
                              <Package className="h-4 w-4" />
                              <span>Order ID</span>
                            </div>
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4" />
                              <span>Customer</span>
                            </div>
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4" />
                              <span>Delivery Date</span>
                            </div>
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                            <div className="flex items-center space-x-2">
                              <Star className="h-4 w-4" />
                              <span>Rating</span>
                            </div>
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                            <div className="flex items-center space-x-2">
                              <Award className="h-4 w-4" />
                              <span>Feedback</span>
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {selectedDeliveryMan.deliveredOrders.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-12">
                              <div className="flex flex-col items-center space-y-3">
                                <Truck className="h-12 w-12 text-gray-400" />
                                <p className="text-gray-500 text-lg font-medium">No delivered orders</p>
                                <p className="text-gray-400 text-sm">This delivery man hasn't completed any orders yet</p>
                              </div>
                            </td>
                          </tr>
                        ) : selectedDeliveryMan.deliveredOrders.map(order => (
                          <tr key={order._id} className="hover:bg-gray-50 transition-all duration-200 group">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-blue-700 font-semibold text-sm">
                                    #{order._id.slice(-4)}
                                  </span>
                                </div>
                                <span className="text-sm font-medium text-gray-900">#{order._id.slice(-6)}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                  <span className="text-gray-700 font-semibold text-sm">
                                    {order.user?.name?.charAt(0)?.toUpperCase() || 'C'}
                                  </span>
                                </div>
                                <span className="text-sm font-medium text-gray-900">
                                  {order.user?.name || 'Anonymous'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <span className="text-sm text-gray-900">
                                  {order.actualDeliveryTime ? 
                                    new Date(order.actualDeliveryTime).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    }) : '-'
                                  }
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {order.deliveryRating ? (
                                <div className="flex items-center space-x-2">
                                  <div className="flex items-center space-x-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star 
                                        key={star}
                                        className={`h-4 w-4 ${
                                          star <= order.deliveryRating 
                                            ? 'text-yellow-400 fill-current' 
                                            : 'text-gray-300'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <Badge variant="secondary" className="text-xs">
                                    {order.deliveryRating}/5
                                  </Badge>
                                </div>
                              ) : (
                                <Badge variant="outline" className="text-gray-500">
                                  No Rating
                                </Badge>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {order.feedbackComment ? (
                                <div className="max-w-xs">
                                  <p className="text-sm text-gray-900 line-clamp-2 italic">
                                    "{order.feedbackComment}"
                                  </p>
                                </div>
                              ) : (
                                <Badge variant="outline" className="text-gray-500">
                                  No Feedback
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="flex flex-col items-center space-y-4">
                    <Users className="h-16 w-16 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900">Select a Delivery Man</h3>
                    <p className="text-gray-500 max-w-md">
                      Choose a delivery man from the dropdown above to view their delivered orders, ratings, and customer feedback.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics; 