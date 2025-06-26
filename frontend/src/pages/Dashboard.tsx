import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService, Order } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp, 
  Star, 
  DollarSign, 
  Package,
  User,
  Calendar
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user?.role !== 'delivery') return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const historyResponse = await apiService.getDeliveryHistory();
        
        if (historyResponse.orders) {
          setHistory(historyResponse.orders);
        } else if (historyResponse.data) {
          setHistory(historyResponse.data);
        }
      } catch (error: any) {
        console.error('Error fetching delivery history:', error);
        toast({
          title: "Error",
          description: "Failed to load delivery history. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, toast]);

  // Calculate earnings per month
  const earningsByMonth: { [key: string]: number } = {};
  history.forEach(order => {
    if (order.status === 'delivered') {
      const date = new Date(order.updatedAt || order.createdAt);
      const month = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      earningsByMonth[month] = (earningsByMonth[month] || 0) + order.totalAmount;
    }
  });
  const months = Object.keys(earningsByMonth).sort();
  const earningsData = {
    labels: months,
    datasets: [
      {
        label: 'Earnings (€)',
        data: months.map(m => earningsByMonth[m]),
        backgroundColor: 'rgba(34,197,94,0.7)',
      },
    ],
  };

  // Collect feedbacks
  const feedbacks = history
    .filter(order => order.feedbackComment || order.deliveryRating)
    .map(order => ({
      id: order._id,
      customer: order.user?.name,
      rating: order.deliveryRating,
      comment: order.feedbackComment,
      date: order.updatedAt || order.createdAt,
    }));

  // Calculate statistics
  const totalEarnings = history
    .filter(order => order.status === 'delivered')
    .reduce((sum, order) => sum + order.totalAmount, 0);
  
  const totalDeliveries = history.filter(order => order.status === 'delivered').length;
  
  const averageRating = feedbacks.length > 0 
    ? feedbacks.reduce((sum, fb) => sum + (fb.rating || 0), 0) / feedbacks.length 
    : 0;

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Your delivery performance and earnings overview</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg">
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

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Total Deliveries</p>
                  <p className="text-2xl font-bold">{totalDeliveries}</p>
                </div>
                <Package className="h-8 w-8 text-white/80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Average Rating</p>
                  <p className="text-2xl font-bold">{averageRating.toFixed(1)}</p>
                </div>
                <Star className="h-8 w-8 text-white/80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Total Feedbacks</p>
                  <p className="text-2xl font-bold">{feedbacks.length}</p>
                </div>
                <User className="h-8 w-8 text-white/80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Earnings Chart */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Monthly Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {months.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No earnings data available yet.</p>
                  <p className="text-sm">Complete your first delivery to see earnings here.</p>
                </div>
              ) : (
                <div className="h-64">
                  <Bar 
                    data={earningsData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        title: { display: false },
                      },
                      scales: {
                        y: { 
                          beginAtZero: true, 
                          ticks: { 
                            callback: function(value) {
                              return '€' + value;
                            }
                          } 
                        },
                      },
                    }} 
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Customer Feedbacks */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Customer Feedbacks
              </CardTitle>
            </CardHeader>
            <CardContent>
              {feedbacks.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Star className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No feedbacks yet.</p>
                  <p className="text-sm">Customer feedbacks will appear here after deliveries.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {feedbacks.map(fb => (
                    <div key={fb.id} className="bg-gray-50 rounded-lg p-4 border-l-4 border-green-400">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900">{fb.customer || 'Customer'}</span>
                        {fb.rating && (
                          <span className="text-yellow-500 font-bold">
                            {'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)}
                          </span>
                        )}
                        <span className="ml-auto text-xs text-gray-400">
                          {new Date(fb.date).toLocaleDateString()}
                        </span>
                      </div>
                      {fb.comment && (
                        <div className="text-gray-700 text-sm italic">"{fb.comment}"</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
