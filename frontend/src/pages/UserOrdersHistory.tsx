import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService, Order } from '../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const UserOrdersHistory: React.FC = () => {
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

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await apiService.getUserOrders();
      setOrders(response.orders || response.data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!selectedOrder) return;

    try {
      await apiService.submitFeedback(selectedOrder._id, feedbackData);
      toast({ title: 'Feedback submitted successfully!' });
      setFeedbackDialog(false);
      setFeedbackData({ deliveryRating: 5, foodRating: 5, feedbackComment: '' });
      fetchOrders();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to submit feedback', variant: 'destructive' });
    }
  };

  const canSubmitFeedback = (order: Order) => {
    return order.status === 'delivered' && !order.deliveryRating && !order.foodRating;
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
      case 'pending': return <span>🕒</span>;
      case 'confirmed': return <span>✅</span>;
      case 'preparing': return <span>🍳</span>;
      case 'ready': return <span>📦</span>;
      case 'out_for_delivery': return <span>🚚</span>;
      case 'delivered': return <span>✔️</span>;
      case 'cancelled': return <span>❌</span>;
      default: return <span>🕒</span>;
    }
  };

  // Only show order history (delivered or cancelled)
  const historyOrders = orders.filter(order => order.status === 'delivered' || order.status === 'cancelled');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-italian-green-700 mx-auto mb-4"></div>
          <p className="text-italian-green-700">Loading your order history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-italian-cream-50 to-white py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-italian-green-800 mb-2">Order History</h1>
            <p className="text-italian-green-600">Your completed and cancelled orders</p>
          </div>
          <Button asChild variant="outline">
            <a href="/orders">View Active Orders</a>
          </Button>
        </div>
        {historyOrders.length === 0 ? (
          <Card className="text-center p-8">
            <div className="text-5xl mb-2">📜</div>
            <h2 className="text-xl font-bold text-italian-green-800 mb-2">No Order History</h2>
            <p className="text-italian-green-600 mb-2">Your completed and cancelled orders will appear here.</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {historyOrders.map((order) => {
              const itemsCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
              // Delivery person avatar
              const deliveryAvatar = order.deliveryMan ? (
                <div className="w-9 h-9 rounded-full bg-italian-green-100 flex items-center justify-center text-italian-green-700 font-bold text-lg border border-italian-green-200">
                  {order.deliveryMan.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                </div>
              ) : null;
              return (
                <div className="relative">
                  <div className={`absolute left-0 top-0 h-full w-1 rounded-l-lg ${
                    order.status === 'delivered' ? 'bg-gradient-to-b from-green-400 to-green-600' : 
                    order.status === 'cancelled' ? 'bg-gradient-to-b from-red-400 to-red-600' : 
                    'bg-gradient-to-b from-gray-400 to-gray-600'
                  }`} />
                  <Card key={order._id} className={`shadow-xl border-0 rounded-xl pl-4 md:pl-6 relative overflow-hidden ${
                    order.status === 'delivered' ? 'bg-gradient-to-br from-green-50 to-green-100' : 
                    order.status === 'cancelled' ? 'bg-gradient-to-br from-red-50 to-red-100' : 
                    'bg-gradient-to-br from-gray-50 to-gray-100'
                  }`}>
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                            <span className="font-mono tracking-wider">#{order._id.slice(-6)}</span>
                            <span className="text-xs text-gray-400 font-normal">{order.status === 'delivered' ? 'Delivered' : 'Cancelled'}</span>
                          </CardTitle>
                          <p className="text-xs text-gray-500 mt-1">Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${getStatusColor(order.status)} flex items-center gap-1 text-xs px-2 py-1 rounded-full`}>{getStatusIcon(order.status)}{order.status.replace('_', ' ').toUpperCase()}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
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
                      <div className={`mb-4 rounded-lg p-3 ${
                        order.status === 'delivered' ? 'bg-green-50' : 
                        order.status === 'cancelled' ? 'bg-red-50' : 
                        'bg-gray-50'
                      }`}>
                        <h4 className="font-semibold text-gray-700 mb-2">Items</h4>
                        <div className="space-y-2">
                          {order.items.map((item, index) => {
                            // Add null check for item.food
                            if (!item.food) {
                              console.warn('Food data is null for item:', item);
                              return (
                                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0 hover:bg-gray-100 rounded-md transition-colors">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                      <span className="text-gray-400 text-xs">N/A</span>
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-800">Food item unavailable</p>
                                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                    </div>
                                  </div>
                                  <p className="font-semibold text-gray-700">€{item.price.toFixed(2)}</p>
                                </div>
                              );
                            }
                            
                            return (
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
                            );
                          })}
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
                        <div className={`mb-4 flex items-center gap-3 rounded-lg p-3 ${
                          order.status === 'delivered' ? 'bg-green-200' : 
                          order.status === 'cancelled' ? 'bg-red-200' : 
                          'bg-gray-200'
                        }`}>
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
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-semibold mb-2">Order Status Timeline:</h4>
                                <div className="space-y-2">
                                  <p className="text-sm">
                                    <span className="text-italian-green-600">Created:</span> {new Date(order.createdAt).toLocaleDateString('en-US', {
                                      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                    })}
                                  </p>
                                  {order.estimatedDeliveryTime && (
                                    <p className="text-sm">
                                      <span className="text-italian-green-600">Estimated Delivery:</span> {new Date(order.estimatedDeliveryTime).toLocaleTimeString('en-US', {
                                        hour: '2-digit', minute: '2-digit', hour12: true
                                      })}
                                    </p>
                                  )}
                                  {order.actualDeliveryTime && (
                                    <p className="text-sm">
                                      <span className="text-italian-green-600">Delivered:</span> {new Date(order.actualDeliveryTime).toLocaleDateString('en-US', {
                                        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                      })}
                                    </p>
                                  )}
                                </div>
                              </div>
                              {order.deliveryNotes && (
                                <div>
                                  <h4 className="font-semibold mb-2">Delivery Notes:</h4>
                                  <p className="text-sm text-italian-green-700">{order.deliveryNotes}</p>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                        {canSubmitFeedback(order) && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order);
                              setFeedbackDialog(true);
                            }}
                          >
                            <Star className="h-4 w-4 mr-1 text-yellow-400" />
                            Leave Feedback
                          </Button>
                        )}
                      </div>
                      {/* Show feedback if exists */}
                      {order.status === 'delivered' && (order.deliveryRating || order.foodRating || order.feedbackComment) && (
                        <div className="mt-8 border-t pt-6">
                          <h4 className="font-semibold text-italian-green-700 mb-2 flex items-center gap-2">
                            <Star className="h-4 w-4" />
                            Your Feedback
                          </h4>
                          <div className="space-y-2">
                            {order.deliveryRating && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">Delivery Rating:</span>
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${i < order.deliveryRating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                            {order.foodRating && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">Food Rating:</span>
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${i < order.foodRating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                            {order.feedbackComment && (
                              <div>
                                <span className="text-sm text-gray-600">Comment:</span>
                                <p className="text-sm text-gray-800 mt-1">{order.feedbackComment}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Leave Feedback</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="deliveryRating">Delivery Rating</Label>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setFeedbackData(prev => ({ ...prev, deliveryRating: rating }))}
                    className={`p-1 ${feedbackData.deliveryRating >= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    <Star className="h-6 w-6 fill-current" />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="foodRating">Food Rating</Label>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setFeedbackData(prev => ({ ...prev, foodRating: rating }))}
                    className={`p-1 ${feedbackData.foodRating >= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    <Star className="h-6 w-6 fill-current" />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="feedbackComment">Comments (Optional)</Label>
              <Textarea
                id="feedbackComment"
                value={feedbackData.feedbackComment}
                onChange={(e) => {
                  if (e.target.value.length <= 250) {
                    setFeedbackData(prev => ({ ...prev, feedbackComment: e.target.value }));
                  }
                }}
                placeholder="Share your experience, suggestions, or anything else..."
                className="mt-1"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">{feedbackData.feedbackComment.length}/250 characters</p>
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
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserOrdersHistory;