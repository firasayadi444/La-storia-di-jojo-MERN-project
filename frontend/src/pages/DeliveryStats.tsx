import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Truck, TrendingUp, Calendar, Star } from 'lucide-react';

const DeliveryStats: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    apiService.getDeliveryHistory().then(res => setOrders(res.orders || res.data || []));
    apiService.getAllFeedbacks().then(res => {
      const myFeedbacks = (res.feedbacks || res.data || []).filter(
        (order: any) => order.deliveryMan?._id === user?._id
      );
      setFeedbacks(myFeedbacks);
    });
  }, [user]);

  const completedOrders = orders;
  const totalEarnings = completedOrders.reduce((sum, order) => sum + order.totalAmount * 0.15, 0);
  const totalDeliveries = completedOrders.length;
  const avgPerDelivery = totalDeliveries > 0 ? totalEarnings / totalDeliveries : 0;

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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Stats & Monthly Earnings History</h1>
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
                  <p className="text-2xl font-bold">€{avgPerDelivery.toFixed(2)}</p>
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
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Calendar className="h-6 w-6 mr-3 text-italian-green-600" />
            Monthly Earnings History
          </h2>
          
          {monthlyEarnings.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Earnings History</h3>
                <p className="text-gray-600">Complete your first delivery to start tracking your monthly earnings.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {monthlyEarnings.map((row, index) => {
                const avgPerDelivery = row.count > 0 ? row.total / row.count : 0;
                const isLatestMonth = index === monthlyEarnings.length - 1;
                
                return (
                  <Card key={row.monthKey} className={`shadow-lg transition-all duration-200 hover:shadow-xl ${
                    isLatestMonth ? 'ring-2 ring-italian-green-200 bg-gradient-to-r from-italian-green-50 to-italian-cream-50' : 'bg-white'
                  }`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full ${
                            isLatestMonth ? 'bg-italian-green-100 text-italian-green-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            <Calendar className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{row.month}</h3>
                            {isLatestMonth && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-italian-green-100 text-italian-green-800">
                                Current Month
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-italian-green-700">€{row.total.toFixed(2)}</p>
                          <p className="text-sm text-gray-500">Total Earnings</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <Truck className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-gray-700">Deliveries</span>
                          </div>
                          <p className="text-xl font-bold text-gray-900">{row.count}</p>
                          <p className="text-xs text-gray-500">orders completed</p>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <TrendingUp className="h-4 w-4 text-purple-600" />
                            <span className="text-sm font-medium text-gray-700">Average</span>
                          </div>
                          <p className="text-xl font-bold text-gray-900">€{avgPerDelivery.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">per delivery</p>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-gray-700">Daily Avg</span>
                          </div>
                          <p className="text-xl font-bold text-gray-900">
                            €{(row.total / Math.max(1, new Date(row.monthKey + '-01').getDate())).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">per day</p>
                        </div>
                      </div>
                      
                      {/* Progress bar showing month completion */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                          <span>Month Progress</span>
                          <span>{Math.round((row.count / Math.max(1, totalDeliveries / monthlyEarnings.length)) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-italian-green-500 to-italian-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${Math.min(100, (row.count / Math.max(1, totalDeliveries / monthlyEarnings.length)) * 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Star className="h-6 w-6 mr-3 text-yellow-500" />
            Customer Feedbacks
          </h2>
          
          {feedbacks.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Feedbacks Yet</h3>
                <p className="text-gray-600">Complete deliveries to start receiving customer feedback.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {feedbacks.map((order: any) => (
                <Card key={order._id} className="shadow-md hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-italian-green-500 to-italian-green-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {order.user?.name?.charAt(0)?.toUpperCase() || 'C'}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{order.user?.name || 'Anonymous'}</h3>
                          <p className="text-sm text-gray-500">
                            Delivered on {new Date(order.actualDeliveryTime || order.updatedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Order #{order._id.slice(-6)}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Truck className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-gray-700">Delivery Rating</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star}
                              className={`h-5 w-5 ${
                                order.deliveryRating && star <= order.deliveryRating 
                                  ? 'text-yellow-400 fill-current' 
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="ml-2 text-sm font-semibold text-gray-700">
                            {order.deliveryRating || 'N/A'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="bg-purple-50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Star className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-medium text-gray-700">Food Rating</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star}
                              className={`h-5 w-5 ${
                                order.foodRating && star <= order.foodRating 
                                  ? 'text-yellow-400 fill-current' 
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="ml-2 text-sm font-semibold text-gray-700">
                            {order.foodRating || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {order.feedbackComment && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-medium text-gray-700">Customer Comment</span>
                        </div>
                        <p className="text-gray-700 italic">"{order.feedbackComment}"</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryStats; 