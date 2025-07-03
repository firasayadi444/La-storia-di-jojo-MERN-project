import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, Truck, Star, MessageSquare, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiService, Order } from '../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

const UserOrders: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [feedbackDialog, setFeedbackDialog] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    deliveryRating: 5,
    foodRating: 5,
    feedbackComment: ''
  });
  // Filtering/search/sort state
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('30d');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  // Status steps for progress bar
  const statusSteps = [
    { key: 'pending', label: 'Pending', icon: <Clock className="h-4 w-4" /> },
    { key: 'confirmed', label: 'Confirmed', icon: <CheckCircle className="h-4 w-4" /> },
    { key: 'preparing', label: 'Preparing', icon: <Clock className="h-4 w-4" /> },
    { key: 'ready', label: 'Ready', icon: <CheckCircle className="h-4 w-4" /> },
    { key: 'out_for_delivery', label: 'Out for Delivery', icon: <Truck className="h-4 w-4" /> },
    { key: 'delivered', label: 'Delivered', icon: <CheckCircle className="h-4 w-4" /> },
  ];

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await apiService.getUserOrders();
      setOrders(response.orders || response.data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load orders",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-purple-100 text-purple-800';
      case 'out_for_delivery': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'preparing': return <Clock className="h-4 w-4" />;
      case 'ready': return <CheckCircle className="h-4 w-4" />;
      case 'out_for_delivery': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSubmitFeedback = async () => {
    if (!selectedOrder) return;

    try {
      await apiService.submitFeedback(selectedOrder._id, feedbackData);
      
      toast({
        title: "Feedback Submitted!",
        description: "Thank you for your feedback. It helps us improve our service!",
      });

      setFeedbackDialog(false);
      setFeedbackData({ deliveryRating: 5, foodRating: 5, feedbackComment: '' });
      fetchOrders(); // Refresh orders to show updated feedback
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit feedback",
        variant: "destructive"
      });
    }
  };

  const canSubmitFeedback = (order: Order) => {
    return order.status === 'delivered' && !order.feedbackComment && !order.deliveryRating;
  };

  // Only show active orders on this page
  const activeOrders = orders.filter(order => order.status !== 'delivered');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-italian-cream-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-italian-green-700 mx-auto mb-4"></div>
          <p className="text-italian-green-700">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-italian-cream-50 to-white py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-italian-green-800 mb-2">
              My Orders
            </h1>
            <p className="text-italian-green-600">
              Track your orders and provide feedback
            </p>
          </div>
          <Button asChild variant="outline">
            <a href="/orders/history">View Order History</a>
          </Button>
        </div>

        {/* Active Orders Section */}
        <div className="mb-10">
          <h2 className="text-2xl font-semibold text-italian-green-700 mb-4">Active Orders</h2>
          {activeOrders.length === 0 ? (
            <Card className="text-center p-8">
              <div className="text-5xl mb-2">🕒</div>
              <h2 className="text-xl font-bold text-italian-green-800 mb-2">No Active Orders</h2>
              <p className="text-italian-green-600 mb-2">You have no orders in progress.</p>
            </Card>
          ) : (
            <div className="space-y-6">
              {activeOrders.map((order) => {
                const placedAgo = (() => {
                  const diff = Date.now() - new Date(order.createdAt).getTime();
                  const min = Math.floor(diff / 60000);
                  if (min < 1) return 'just now';
                  if (min < 60) return `${min} min ago`;
                  const hr = Math.floor(min / 60);
                  if (hr < 24) return `${hr} hr${hr > 1 ? 's' : ''} ago`;
                  const d = Math.floor(hr / 24);
                  return `${d} day${d > 1 ? 's' : ''} ago`;
                })();
                const itemsCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
                // Delivery person avatar
                const deliveryAvatar = order.deliveryMan ? (
                  <div className="w-9 h-9 rounded-full bg-italian-green-100 flex items-center justify-center text-italian-green-700 font-bold text-lg border border-italian-green-200">
                    {order.deliveryMan.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                  </div>
                ) : null;
                return (
                  <div className="relative">
                    <div className="absolute left-0 top-0 h-full w-1 rounded-l-lg bg-gradient-to-b from-italian-green-400 to-italian-green-600" />
                    <Card className="shadow-xl border-0 bg-white rounded-xl pl-4 md:pl-6 relative overflow-hidden">
                      <CardHeader className="pb-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                              <span className="font-mono tracking-wider">#{order._id.slice(-6)}</span>
                              <span className="text-xs text-gray-400 font-normal">({placedAgo})</span>
                            </CardTitle>
                            <p className="text-xs text-gray-500 mt-1">Placed on {formatDate(order.createdAt)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`${getStatusColor(order.status)} flex items-center gap-1 text-xs px-2 py-1 rounded-full`}>{getStatusIcon(order.status)}{order.status.replace('_', ' ').toUpperCase()}</Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {/* Status Progress Bar */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between gap-2">
                            {statusSteps.map((step, idx) => {
                              const currentIdx = statusSteps.findIndex(s => s.key === order.status);
                              const isActive = idx <= currentIdx;
                              const isCurrent = idx === currentIdx;
                              return (
                                <div key={step.key} className="flex-1 flex flex-col items-center">
                                  <div className={`rounded-full p-2 transition-all duration-300 ${isCurrent ? 'bg-italian-green-600 text-white scale-110 shadow-lg' : isActive ? 'bg-italian-green-200 text-italian-green-800' : 'bg-gray-200 text-gray-400'}`}
                                       style={{ transition: 'all 0.3s cubic-bezier(.4,2,.6,1)' }}>
                                    {step.icon}
                                  </div>
                                  <span className={`text-xs mt-1 ${isCurrent ? 'font-bold text-italian-green-700' : isActive ? 'text-italian-green-600' : 'text-gray-400'}`}>{step.label}</span>
                                  {idx < statusSteps.length - 1 && (
                                    <div className={`w-full h-2 mt-1 rounded-full ${isActive ? 'bg-italian-green-300' : 'bg-gray-200'} transition-all duration-300`}></div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        {/* Items Summary */}
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">{itemsCount} item{itemsCount > 1 ? 's' : ''}</span>
                            <span className="text-gray-300">·</span>
                            <span className="text-sm font-semibold text-italian-green-700">€{order.totalAmount.toFixed(2)}</span>
                          </div>
                          {deliveryAvatar}
                        </div>
                        {/* Order Items */}
                        <div className="mb-4 bg-gray-50 rounded-lg p-3">
                          <h4 className="font-semibold text-gray-700 mb-2">Items</h4>
                          <div className="space-y-2">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0 hover:bg-gray-100 rounded-md transition-colors">
                                <div className="flex items-center space-x-3">
                                  <img
                                    src={item.food.image}
                                    alt={item.food.name}
                                    className="w-12 h-12 object-cover rounded-lg"
                                    onError={(e) => {
                                      e.currentTarget.src = `https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=48&h=48&fit=crop`;
                                    }}
                                  />
                                  <div>
                                    <p className="font-medium text-gray-800">{item.food.name}</p>
                                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                  </div>
                                </div>
                                <p className="font-semibold text-gray-700">€{item.price.toFixed(2)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        {/* Order Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-italian-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 9.4V7A4.5 4.5 0 008 7v2.4M12 17v.01M12 21a9 9 0 100-18 9 9 0 000 18z" /></svg>
                            <span className="text-sm text-gray-600">{order.deliveryAddress}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-italian-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 10c-4.418 0-8-1.79-8-4V7c0-2.21 3.582-4 8-4s8 1.79 8 4v7c0 2.21-3.582 4-8 4z" /></svg>
                            <span className="text-sm font-bold text-italian-green-700">€{order.totalAmount.toFixed(2)}</span>
                          </div>
                        </div>
                        {/* Delivery Man Info */}
                        {order.deliveryMan && (
                          <div className="mb-4 flex items-center gap-3 bg-italian-cream-100 rounded-lg p-3">
                            {deliveryAvatar}
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Delivery Person</p>
                              <p className="font-medium text-gray-800">{order.deliveryMan.name}</p>
                              {order.deliveryMan.phone && (
                                <p className="text-xs text-gray-500">{order.deliveryMan.phone}</p>
                              )}
                            </div>
                          </div>
                        )}
                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Order Details - #{order._id.slice(-6)}</DialogTitle>
                              </DialogHeader>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
                                {/* Left: Receipt-style Itemization */}
                                <div>
                                  <h4 className="font-semibold text-italian-green-700 mb-2">Items</h4>
                                  <div className="space-y-3">
                                    {order.items.map((item, idx) => (
                                      <div key={idx} className="flex items-center gap-3 border-b pb-2 last:border-b-0">
                                        <img
                                          src={item.food.image}
                                          alt={item.food.name}
                                          className="w-14 h-14 object-cover rounded-lg border"
                                          onError={e => { e.currentTarget.src = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=48&h=48&fit=crop'; }}
                                        />
                                        <div className="flex-1">
                                          <div className="font-medium text-gray-800">{item.food.name}</div>
                                          <div className="text-xs text-gray-500">Qty: {item.quantity}</div>
                                        </div>
                                        <div className="font-semibold text-gray-700">€{item.price.toFixed(2)}</div>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="mt-4 border-t pt-4">
                                    <div className="flex justify-between text-sm mb-2">
                                      <span className="text-gray-500">Subtotal</span>
                                      <span className="font-medium text-gray-800">€{order.items.reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm mb-2">
                                      <span className="text-gray-500">Delivery Fee</span>
                                      <span className="font-medium text-gray-700">Included</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                                      <span className="text-gray-800">Total</span>
                                      <span className="text-italian-green-700">€{order.totalAmount.toFixed(2)}</span>
                                    </div>
                                  </div>
                                </div>
                                {/* Right: Timeline & Info */}
                                <div>
                                  <h4 className="font-semibold text-italian-green-700 mb-2">Delivery Timeline</h4>
                                  <div className="relative pl-6 border-l-2 border-italian-green-100 space-y-6">
                                    {/* Timeline steps */}
                                    {statusSteps.map((step, idx) => {
                                      const currentIdx = statusSteps.findIndex(s => s.key === order.status);
                                      const isActive = idx <= currentIdx;
                                      let timestamp = null;
                                      if (idx === 0) timestamp = order.createdAt;
                                      if (step.key === 'ready' && order.estimatedDeliveryTime) timestamp = order.estimatedDeliveryTime;
                                      if (step.key === 'delivered' && order.actualDeliveryTime) timestamp = order.actualDeliveryTime;
                                      return (
                                        <div key={step.key} className="flex items-start gap-3">
                                          <div className={`rounded-full p-2 mt-0.5 ${isActive ? 'bg-italian-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}>{step.icon}</div>
                                          <div>
                                            <div className={`font-medium ${isActive ? 'text-italian-green-700' : 'text-gray-400'}`}>{step.label}</div>
                                            {timestamp && <div className="text-xs text-gray-500">{new Date(timestamp).toLocaleString()}</div>}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  <div className="mt-6">
                                    <h4 className="font-semibold text-italian-green-700 mb-2">Delivery Address</h4>
                                    <div className="text-sm text-gray-700 mb-2">{order.deliveryAddress}</div>
                                    {order.deliveryMan && (
                                      <div className="mb-2">
                                        <span className="text-sm text-gray-500">Delivery Person: </span>
                                        <span className="font-medium text-gray-800">{order.deliveryMan.name}</span>
                                        {order.deliveryMan.phone && (
                                          <span className="text-sm text-gray-500 ml-2">{order.deliveryMan.phone}</span>
                                        )}
                                      </div>
                                    )}
                                    {order.deliveryNotes && (
                                      <div className="text-xs text-gray-500 mt-2">Notes: {order.deliveryNotes}</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {/* Rating Section */}
                              {order.status === 'delivered' && (
                                <div className="mt-8 border-t pt-6">
                                  <h4 className="font-semibold text-italian-green-700 mb-2 flex items-center gap-2">
                                    <Star className="h-4 w-4" />
                                    Your Feedback
                                  </h4>
                                  <div className="space-y-2">
                                    {order.deliveryRating && (
                                      <p className="text-sm">
                                        <span className="text-gray-600">Delivery Rating:</span>
                                        <span className="ml-2 text-yellow-500">{'⭐'.repeat(order.deliveryRating)}</span>
                                      </p>
                                    )}
                                    {order.foodRating && (
                                      <p className="text-sm">
                                        <span className="text-gray-600">Food Rating:</span>
                                        <span className="ml-2 text-yellow-500">{'⭐'.repeat(order.foodRating)}</span>
                                      </p>
                                    )}
                                    {order.feedbackComment && (
                                      <p className="text-sm">
                                        <span className="text-gray-600">Comment:</span>
                                        <span className="ml-2 italic text-gray-700">"{order.feedbackComment}"</span>
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          {order.status === 'pending' && (
                            <Button variant="destructive" size="sm">
                              Cancel Order
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Feedback Dialog */}
        <Dialog open={feedbackDialog} onOpenChange={setFeedbackDialog}>
          <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl shadow-2xl border-0">
            {/* Colorful Header */}
            <div className="bg-gradient-to-r from-green-400 via-emerald-400 to-italian-green-600 px-6 py-4 flex items-center gap-3">
              <Star className="h-7 w-7 text-yellow-300 drop-shadow-lg animate-bounce" />
              <div>
                <h2 className="text-lg font-bold text-white">We Value Your Feedback!</h2>
                <p className="text-white text-xs opacity-80">Help us improve your experience</p>
              </div>
            </div>
            <div className="p-6 bg-white">
              <div className="space-y-5">
                {/* Delivery Rating */}
                <div>
                  <Label htmlFor="deliveryRating" className="font-semibold text-italian-green-800">Delivery Rating</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        aria-label={`Rate delivery ${star} star${star > 1 ? 's' : ''}`}
                        onClick={() => setFeedbackData(prev => ({ ...prev, deliveryRating: star }))}
                        className={`text-3xl transition-transform duration-150 ${feedbackData.deliveryRating >= star ? 'text-yellow-400 scale-110' : 'text-gray-300'} hover:scale-125 focus:outline-none`}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Poor</span>
                    <span>Excellent</span>
                  </div>
                </div>
                {/* Food Rating */}
                <div>
                  <Label htmlFor="foodRating" className="font-semibold text-italian-green-800">Food Rating</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        aria-label={`Rate food ${star} star${star > 1 ? 's' : ''}`}
                        onClick={() => setFeedbackData(prev => ({ ...prev, foodRating: star }))}
                        className={`text-3xl transition-transform duration-150 ${feedbackData.foodRating >= star ? 'text-yellow-400 scale-110' : 'text-gray-300'} hover:scale-125 focus:outline-none`}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Poor</span>
                    <span>Excellent</span>
                  </div>
                </div>
                {/* Feedback Comment */}
                <div>
                  <Label htmlFor="feedbackComment" className="font-semibold text-italian-green-800">Additional Comments</Label>
                  <Textarea
                    id="feedbackComment"
                    value={feedbackData.feedbackComment}
                    onChange={(e) => {
                      if (e.target.value.length <= 250) {
                        setFeedbackData(prev => ({ ...prev, feedbackComment: e.target.value }));
                      }
                    }}
                    placeholder="Share your experience, suggestions, or anything else..."
                    rows={3}
                    className="mt-1 border-italian-cream-200 focus:ring-italian-green-400"
                  />
                  <div className="text-xs text-gray-400 text-right mt-1">{feedbackData.feedbackComment.length}/250</div>
                </div>
                {/* Action Buttons */}
                <div className="flex justify-end space-x-2 pt-2">
                  <Button variant="outline" onClick={() => setFeedbackDialog(false)} className="rounded-full px-5 py-2 border-gray-300">
                    Cancel
                  </Button>
                  <Button onClick={handleSubmitFeedback} className="btn-gradient text-white rounded-full px-5 py-2 shadow-lg">
                    Submit Feedback
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default UserOrders; 