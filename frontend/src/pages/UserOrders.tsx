import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, Truck, Star, MessageSquare, Eye, X, RefreshCw, Navigation } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiService, Order } from '../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useSocket } from '../contexts/SocketContext';

const UserOrders: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [feedbackDialog, setFeedbackDialog] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    deliveryRating: 5,
    foodRating: 5,
    feedbackComment: ''
  });
  const [cancellingOrder, setCancellingOrder] = useState<string | null>(null);
  const [cancelConfirmDialog, setCancelConfirmDialog] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { registerRefreshCallback, unregisterRefreshCallback } = useSocket();

  useEffect(() => {
    fetchOrders();
    
    // Check for any stored order updates from when component was unmounted
    const checkStoredUpdates = () => {
      const storedUpdate = localStorage.getItem('latest-order-update');
      if (storedUpdate) {
        try {
          const update = JSON.parse(storedUpdate);
          const timeDiff = Date.now() - update.timestamp;
          // Only process updates from the last 30 seconds
          if (timeDiff < 30000) {
            fetchOrders(true);
          }
          // Clear the stored update after processing
          localStorage.removeItem('latest-order-update');
        } catch (error) {
          console.error('Error processing stored order update:', error);
        }
      }
    };
    
    checkStoredUpdates();
  }, []);

  // Register WebSocket refresh callback
  useEffect(() => {
    const refreshKey = 'user-orders';
    registerRefreshCallback(refreshKey, () => {
      fetchOrders(true); // Show refresh indicator
    });

    // Also listen for global order-updated events
    const handleGlobalOrderUpdate = (event: CustomEvent) => {
      fetchOrders(true);
    };

    window.addEventListener('order-updated', handleGlobalOrderUpdate as EventListener);

    return () => {
      unregisterRefreshCallback(refreshKey);
      window.removeEventListener('order-updated', handleGlobalOrderUpdate as EventListener);
    };
  }, []); // Remove dependencies to prevent re-registration

  const fetchOrders = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      const response = await apiService.getUserOrders();
      const allOrders = response.orders || response.data || [];
      // Filter out delivered and cancelled orders - only show active orders
      const activeOrders = allOrders.filter(order => 
        order.status !== 'delivered' && order.status !== 'cancelled'
      );
      setOrders(activeOrders);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load orders",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
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

  const handleCancelOrderClick = (order: Order) => {
    setOrderToCancel(order);
    setCancelConfirmDialog(true);
  };

  const handleCancelOrder = async () => {
    if (!orderToCancel) return;

    setCancellingOrder(orderToCancel._id);
    setCancelConfirmDialog(false);
    
    try {
      await apiService.cancelOrder(orderToCancel._id);
      
      toast({
        title: "Order Cancelled",
        description: "Your order has been cancelled successfully.",
      });
      
      fetchOrders(); // Refresh orders
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel order",
        variant: "destructive"
      });
    } finally {
      setCancellingOrder(null);
      setOrderToCancel(null);
    }
  };

  const canSubmitFeedback = (order: Order) => {
    return order.status === 'delivered' && !order.feedbackComment && !order.deliveryRating;
  };

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
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-italian-green-800">
              My Active Orders
            </h1>
            {isRefreshing && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Updating...</span>
              </div>
            )}
          </div>
          <p className="text-italian-green-600">
            Track your current orders and provide feedback
          </p>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <Card className="text-center p-8">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold text-italian-green-800 mb-2">No Active Orders</h2>
            <p className="text-italian-green-600 mb-6">
              You don't have any active orders at the moment. Place a new order to get started!
            </p>
            <Button asChild className="btn-gradient text-white">
              <a href="/">Browse Menu</a>
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order._id} className="shadow-lg border-0">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg text-italian-green-800">
                        Order #{order._id.slice(-6)}
                      </CardTitle>
                      <p className="text-sm text-italian-green-600">
                        Placed on {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge className={`${getStatusColor(order.status)} flex items-center gap-1`}>
                        {getStatusIcon(order.status)}
                        {order.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`${
                          (typeof order.payment === 'object' && order.payment?.paymentStatus === 'paid')
                            ? 'text-green-600 border-green-600' 
                            : (typeof order.payment === 'object' && order.payment?.paymentStatus === 'failed')
                            ? 'text-red-600 border-red-600'
                            : 'text-yellow-600 border-yellow-600'
                        }`}
                      >
                        {typeof order.payment === 'object' && order.payment?.paymentMethod === 'cash' ? '💵 Cash' : '💳 Card'} - {typeof order.payment === 'object' ? order.payment?.paymentStatus?.toUpperCase() || 'PENDING' : 'PENDING'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {/* Order Items */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-italian-green-800 mb-2">Items:</h4>
                    <div className="space-y-2">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-italian-cream-200 last:border-b-0">
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
                              <p className="font-medium text-italian-green-800">{item.food.name}</p>
                              <p className="text-sm text-italian-green-600">Qty: {item.quantity}</p>
                            </div>
                          </div>
                          <p className="font-semibold text-italian-green-700">€{item.price.toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-italian-green-600">Delivery Address:</p>
                      <p className="font-medium text-italian-green-800">{order.deliveryAddress}</p>
                    </div>
                    <div>
                      <p className="text-sm text-italian-green-600">Total Amount:</p>
                      <p className="font-bold text-xl text-italian-green-700">€{order.totalAmount.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Delivery Man Info */}
                  {order.deliveryMan && (
                    <div className="mb-4 p-3 bg-italian-cream-100 rounded-lg">
                      <p className="text-sm text-italian-green-600 mb-1">Delivery Person:</p>
                      <p className="font-medium text-italian-green-800">{order.deliveryMan.name}</p>
                      {order.deliveryMan.phone && (
                        <p className="text-sm text-italian-green-600">{order.deliveryMan.phone}</p>
                      )}
                    </div>
                  )}

                  {/* Feedback Section */}
                  {order.status === 'delivered' && (
                    <div className="border-t border-italian-cream-200 pt-4">
                      {order.feedbackComment || order.deliveryRating ? (
                        <div>
                          <h4 className="font-semibold text-italian-green-800 mb-2 flex items-center gap-2">
                            <Star className="h-4 w-4" />
                            Your Feedback
                          </h4>
                          <div className="space-y-2">
                            {order.deliveryRating && (
                              <p className="text-sm">
                                <span className="text-italian-green-600">Delivery Rating:</span>
                                <span className="ml-2">{'⭐'.repeat(order.deliveryRating)}</span>
                              </p>
                            )}
                            {order.foodRating && (
                              <p className="text-sm">
                                <span className="text-italian-green-600">Food Rating:</span>
                                <span className="ml-2">{'⭐'.repeat(order.foodRating)}</span>
                              </p>
                            )}
                            {order.feedbackComment && (
                              <p className="text-sm">
                                <span className="text-italian-green-600">Comment:</span>
                                <span className="ml-2 italic">"{order.feedbackComment}"</span>
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-italian-green-600">
                            How was your experience with this order?
                          </p>
                          <Button
                            onClick={() => {
                              setSelectedOrder(order);
                              setFeedbackDialog(true);
                            }}
                            size="sm"
                            className="btn-gradient text-white"
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Leave Feedback
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-2 pt-4 border-t border-italian-cream-200">
                    {/* Track Delivery Button for Active Orders */}
                    {['confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(order.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/track-delivery/${order._id}`)}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                      >
                        <Navigation className="h-4 w-4 mr-2" />
                        Track Delivery
                      </Button>
                    )}

                    {/* Cancel Button for Pending Orders */}
                    {order.status === 'pending' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleCancelOrderClick(order)}
                        disabled={cancellingOrder === order._id}
                      >
                        {cancellingOrder === order._id ? (
                          <>
                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                            Cancelling...
                          </>
                        ) : (
                          <>
                            <X className="h-4 w-4 mr-2" />
                            Cancel Order
                          </>
                        )}
                      </Button>
                    )}
                    
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
                                <span className="text-italian-green-600">Created:</span> {formatDate(order.createdAt)}
                              </p>
                              {order.estimatedDeliveryTime && (
                                <p className="text-sm">
                                  <span className="text-italian-green-600">Estimated Delivery:</span> {formatTime(order.estimatedDeliveryTime)}
                                </p>
                              )}
                              {order.actualDeliveryTime && (
                                <p className="text-sm">
                                  <span className="text-italian-green-600">Delivered:</span> {formatDate(order.actualDeliveryTime)}
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
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Feedback Dialog */}
        <Dialog open={feedbackDialog} onOpenChange={setFeedbackDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Leave Feedback</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="deliveryRating">Delivery Rating</Label>
                <div className="flex space-x-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackData(prev => ({ ...prev, deliveryRating: star }))}
                      className={`text-2xl ${feedbackData.deliveryRating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <Label htmlFor="foodRating">Food Rating</Label>
                <div className="flex space-x-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackData(prev => ({ ...prev, foodRating: star }))}
                      className={`text-2xl ${feedbackData.foodRating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <Label htmlFor="feedbackComment">Additional Comments (Optional)</Label>
                <Textarea
                  id="feedbackComment"
                  value={feedbackData.feedbackComment}
                  onChange={(e) => setFeedbackData(prev => ({ ...prev, feedbackComment: e.target.value }))}
                  placeholder="Share your experience with us..."
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setFeedbackDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitFeedback} className="btn-gradient text-white">
                  Submit Feedback
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Cancel Order Confirmation Dialog */}
        <Dialog open={cancelConfirmDialog} onOpenChange={setCancelConfirmDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <X className="h-5 w-5 text-red-500" />
                Cancel Order
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to cancel this order? This action cannot be undone.
              </p>
              {orderToCancel && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium">Order #{orderToCancel._id.slice(-6)}</p>
                  <p className="text-sm text-gray-600">
                    Total: ${orderToCancel.totalAmount.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setCancelConfirmDialog(false)}
                disabled={cancellingOrder !== null}
              >
                Keep Order
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleCancelOrder}
                disabled={cancellingOrder !== null}
              >
                {cancellingOrder ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  'Yes, Cancel Order'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default UserOrders;