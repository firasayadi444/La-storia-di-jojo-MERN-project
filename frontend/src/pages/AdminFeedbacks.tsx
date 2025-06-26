import React, { useEffect, useState } from 'react';
import { apiService, Order } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Star, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Archive, 
  TrendingUp, 
  TrendingDown,
  MessageSquare,
  User,
  Calendar,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface FeedbackData {
  id: string;
  orderId: string;
  customer: string;
  deliveryMan?: string;
  foodRating?: number;
  deliveryRating?: number;
  comment?: string;
  date: string;
  status: 'new' | 'reviewed' | 'archived';
  sentiment: 'positive' | 'neutral' | 'negative';
}

const AdminFeedbacks: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<Order[]>([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState<FeedbackData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackData | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { toast } = useToast();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sentimentFilter, setSentimentFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await apiService.getAllFeedbacks();
      const feedbackData = (res.feedbacks || res.data || []).map((order: Order) => ({
        id: order._id,
        orderId: order._id.slice(-6),
        customer: order.user?.name || 'Unknown',
        deliveryMan: order.deliveryMan?.name,
        foodRating: order.foodRating,
        deliveryRating: order.deliveryRating,
        comment: order.feedbackComment,
        date: order.updatedAt || order.createdAt,
        status: 'new' as const, // You can add status field to your order model
        sentiment: getSentiment(order.deliveryRating || 0, order.foodRating || 0, order.feedbackComment || '')
      }));
      setFeedbacks(res.feedbacks || res.data || []);
      setFilteredFeedbacks(feedbackData);
    } catch (e) {
      console.error('Error fetching feedbacks:', e);
      toast({
        title: "Error",
        description: "Failed to load feedbacks",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getSentiment = (deliveryRating: number, foodRating: number, comment: string): 'positive' | 'neutral' | 'negative' => {
    const avgRating = (deliveryRating + foodRating) / 2;
    if (avgRating >= 4) return 'positive';
    if (avgRating <= 2) return 'negative';
    return 'neutral';
  };

  useEffect(() => { fetchFeedbacks(); }, []);

  // Apply filters
  useEffect(() => {
    let filtered = feedbacks.map((order: Order) => ({
      id: order._id,
      orderId: order._id.slice(-6),
      customer: order.user?.name || 'Unknown',
      deliveryMan: order.deliveryMan?.name,
      foodRating: order.foodRating,
      deliveryRating: order.deliveryRating,
      comment: order.feedbackComment,
      date: order.updatedAt || order.createdAt,
      status: 'new' as const,
      sentiment: getSentiment(order.deliveryRating || 0, order.foodRating || 0, order.feedbackComment || '')
    }));

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(fb => 
        fb.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fb.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fb.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fb.deliveryMan?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Rating filter
    if (ratingFilter !== 'all') {
      const rating = parseInt(ratingFilter);
      filtered = filtered.filter(fb => 
        (fb.deliveryRating === rating) || (fb.foodRating === rating)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(fb => fb.status === statusFilter);
    }

    // Sentiment filter
    if (sentimentFilter !== 'all') {
      filtered = filtered.filter(fb => fb.sentiment === sentimentFilter);
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      const daysAgo = dateRange === 'today' ? 0 : 
                     dateRange === 'week' ? 7 : 
                     dateRange === 'month' ? 30 : 0;
      
      if (daysAgo > 0) {
        const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
        filtered = filtered.filter(fb => new Date(fb.date) >= cutoffDate);
      }
    }

    setFilteredFeedbacks(filtered);
  }, [feedbacks, searchTerm, ratingFilter, statusFilter, sentimentFilter, dateRange]);

  // Analytics calculations
  const totalFeedbacks = filteredFeedbacks.length;
  const avgDeliveryRating = filteredFeedbacks.length > 0 
    ? filteredFeedbacks.reduce((sum, fb) => sum + (fb.deliveryRating || 0), 0) / filteredFeedbacks.filter(fb => fb.deliveryRating).length 
    : 0;
  const avgFoodRating = filteredFeedbacks.length > 0 
    ? filteredFeedbacks.reduce((sum, fb) => sum + (fb.foodRating || 0), 0) / filteredFeedbacks.filter(fb => fb.foodRating).length 
    : 0;
  const negativeFeedbacks = filteredFeedbacks.filter(fb => fb.sentiment === 'negative').length;
  const positiveFeedbacks = filteredFeedbacks.filter(fb => fb.sentiment === 'positive').length;
  const negativePercentage = totalFeedbacks > 0 ? (negativeFeedbacks / totalFeedbacks) * 100 : 0;
  const positivePercentage = totalFeedbacks > 0 ? (positiveFeedbacks / totalFeedbacks) * 100 : 0;

  const exportData = () => {
    const csvContent = [
      ['Order ID', 'Customer', 'Delivery Man', 'Food Rating', 'Delivery Rating', 'Comment', 'Date', 'Sentiment'],
      ...filteredFeedbacks.map(fb => [
        fb.orderId,
        fb.customer,
        fb.deliveryMan || '',
        fb.foodRating?.toString() || '',
        fb.deliveryRating?.toString() || '',
        fb.comment || '',
        new Date(fb.date).toLocaleDateString(),
        fb.sentiment
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedbacks-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: "Feedback data has been exported to CSV",
    });
  };

  const renderStars = (rating: number | undefined) => {
    if (!rating) return <span className="text-gray-400">-</span>;
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating})</span>
      </div>
    );
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800 border-green-200';
      case 'negative': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <CheckCircle className="h-4 w-4" />;
      case 'negative': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Feedback Dashboard</h1>
              <p className="text-gray-600">Monitor and analyze customer feedback and ratings</p>
            </div>
            <Button onClick={exportData} className="bg-green-600 hover:bg-green-700">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm">Total Feedbacks</p>
                    <p className="text-2xl font-bold">{totalFeedbacks}</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-white/80" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm">Avg Delivery Rating</p>
                    <p className="text-2xl font-bold">{avgDeliveryRating.toFixed(1)}</p>
                  </div>
                  <Star className="h-8 w-8 text-white/80" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm">Avg Food Rating</p>
                    <p className="text-2xl font-bold">{avgFoodRating.toFixed(1)}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-white/80" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm">Negative Feedback</p>
                    <p className="text-2xl font-bold">{negativePercentage.toFixed(1)}%</p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-white/80" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search feedbacks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={ratingFilter} onValueChange={setRatingFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ratings</SelectItem>
                    <SelectItem value="5">5 Stars</SelectItem>
                    <SelectItem value="4">4 Stars</SelectItem>
                    <SelectItem value="3">3 Stars</SelectItem>
                    <SelectItem value="2">2 Stars</SelectItem>
                    <SelectItem value="1">1 Star</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by sentiment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sentiments</SelectItem>
                    <SelectItem value="positive">Positive</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="negative">Negative</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feedback Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Feedback Details</span>
              <Badge variant="secondary">
                {filteredFeedbacks.length} feedbacks
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading feedbacks...</p>
              </div>
            ) : filteredFeedbacks.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No feedbacks found</h3>
                <p className="text-gray-600">Try adjusting your filters or search terms.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Man</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Food Rating</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Rating</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sentiment</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredFeedbacks.map((feedback) => (
                      <tr key={feedback.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{feedback.orderId}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                              <User className="h-4 w-4 text-gray-600" />
                            </div>
                            {feedback.customer}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {feedback.deliveryMan || '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {renderStars(feedback.foodRating)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {renderStars(feedback.deliveryRating)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Badge className={`${getSentimentColor(feedback.sentiment)} flex items-center gap-1`}>
                            {getSentimentIcon(feedback.sentiment)}
                            {feedback.sentiment}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(feedback.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedFeedback(feedback);
                              setIsDetailOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feedback Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Feedback Details</DialogTitle>
          </DialogHeader>
          {selectedFeedback && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Order ID</label>
                  <p className="text-lg font-semibold">#{selectedFeedback.orderId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Date</label>
                  <p className="text-lg">{new Date(selectedFeedback.date).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Customer</label>
                  <p className="text-lg">{selectedFeedback.customer}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Delivery Man</label>
                  <p className="text-lg">{selectedFeedback.deliveryMan || 'Not assigned'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Food Rating</label>
                  <div className="mt-1">{renderStars(selectedFeedback.foodRating)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Delivery Rating</label>
                  <div className="mt-1">{renderStars(selectedFeedback.deliveryRating)}</div>
                </div>
              </div>

              {selectedFeedback.comment && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Comment</label>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-900 italic">"{selectedFeedback.comment}"</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Badge className={getSentimentColor(selectedFeedback.sentiment)}>
                  {getSentimentIcon(selectedFeedback.sentiment)}
                  {selectedFeedback.sentiment} sentiment
                </Badge>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                  Close
                </Button>
                <Button variant="outline" className="text-orange-600 border-orange-200">
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFeedbacks; 