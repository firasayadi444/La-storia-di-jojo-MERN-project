import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService, Order } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Clock, ShoppingCart, MapPin, Truck, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ [orderId: string]: { deliveryRating: number; foodRating: number; feedbackComment: string } }>({});
  const [submittingFeedback, setSubmittingFeedback] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const response = await apiService.getUserOrders();
        if (response.orders) {
          setOrders(response.orders);
        } else if (response.data) {
          setOrders(response.data);
        }
      } catch (error: any) {
        console.error('Error fetching orders:', error);
        toast({
          title: "Error",
          description: "Failed to load order history. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, toast]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Please login to view your dashboard</p>
      </div>
    );
  }

  const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'out_for_delivery': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user.name}!</h1>
          <p className="text-gray-600">Manage your account and view your order history</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-primary text-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Total Orders</p>
                  <p className="text-2xl font-bold">{orders.length}</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-white/80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-secondary text-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Total Spent</p>
                  <p className="text-2xl font-bold">€{totalSpent.toFixed(2)}</p>
                </div>
                <Clock className="h-8 w-8 text-white/80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-2 border-food-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Member Since</p>
                  <p className="text-2xl font-bold text-gray-900">2024</p>
                </div>
                <User className="h-8 w-8 text-food-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Profile Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Name</label>
                <p className="text-lg text-gray-900">{user.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Email</label>
                <p className="text-lg text-gray-900">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Role</label>
                <Badge className="ml-2 bg-food-orange-100 text-food-orange-800">
                  {user.role}
                </Badge>
              </div>
              {user.address && (
                <div>
                  <label className="text-sm font-medium text-gray-600 flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>Address</span>
                  </label>
                  <p className="text-lg text-gray-900">{user.address}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order History */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Order History</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-food-orange-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading orders...</p>
                  </div>
                ) : orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.slice(0, 10).map((order) => (
                      <div key={order._id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {order.items.map(item => item.food?.name || 'Unknown Item').join(', ')}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {new Date(order.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-food-orange-600">€{order.totalAmount.toFixed(2)}</p>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">
                          <MapPin className="h-3 w-3 inline mr-1" />
                          {order.deliveryAddress}
                        </p>
                        <div className="mt-2 text-sm text-gray-500">
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''} • 
                          Total: {order.items.reduce((sum, item) => sum + item.quantity, 0)} qty
                        </div>
                        {order.deliveryMan && (
                          <div className="mt-2 text-sm text-blue-600">
                            <Truck className="h-3 w-3 inline mr-1" />
                            Assigned to: {order.deliveryMan.name}
                          </div>
                        )}
                        {order.estimatedDeliveryTime && (
                          <div className="mt-1 text-sm text-gray-500">
                            <Clock className="h-3 w-3 inline mr-1" />
                            Estimated delivery: {new Date(order.estimatedDeliveryTime).toLocaleString()}
                          </div>
                        )}
                        {/* Feedback form for delivered orders without feedback */}
                        {order.status === 'delivered' && (order.deliveryRating == null || order.foodRating == null) && (
                          <div className="mt-4 bg-gray-50 p-3 rounded-lg">
                            <h5 className="font-medium mb-2">Rate Your Experience</h5>
                            <form
                              onSubmit={async (e) => {
                                e.preventDefault();
                                setSubmittingFeedback(order._id);
                                try {
                                  await apiService.submitFeedback(order._id, feedback[order._id]);
                                  toast({ title: 'Thank you!', description: 'Your feedback was submitted.' });
                                  // Refresh orders
                                  const response = await apiService.getUserOrders();
                                  setOrders(response.orders || response.data || []);
                                } catch (err: any) {
                                  toast({ title: 'Error', description: err.message, variant: 'destructive' });
                                } finally {
                                  setSubmittingFeedback(null);
                                }
                              }}
                              className="space-y-2"
                            >
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Delivery Service</label>
                                <div className="flex space-x-1">
                                  {[1,2,3,4,5].map(star => (
                                    <button
                                      type="button"
                                      key={star}
                                      onClick={() => setFeedback(f => ({ ...f, [order._id]: { ...f[order._id], deliveryRating: star } }))}
                                      className={
                                        (feedback[order._id]?.deliveryRating || 0) >= star
                                          ? 'text-yellow-400'
                                          : 'text-gray-300'
                                      }
                                    >
                                      <Star className="h-5 w-5" fill="currentColor" />
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Food Quality</label>
                                <div className="flex space-x-1">
                                  {[1,2,3,4,5].map(star => (
                                    <button
                                      type="button"
                                      key={star}
                                      onClick={() => setFeedback(f => ({ ...f, [order._id]: { ...f[order._id], foodRating: star } }))}
                                      className={
                                        (feedback[order._id]?.foodRating || 0) >= star
                                          ? 'text-yellow-400'
                                          : 'text-gray-300'
                                      }
                                    >
                                      <Star className="h-5 w-5" fill="currentColor" />
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Comment (optional)</label>
                                <textarea
                                  className="w-full border rounded p-2 text-sm"
                                  rows={2}
                                  value={feedback[order._id]?.feedbackComment || ''}
                                  onChange={e => setFeedback(f => ({ ...f, [order._id]: { ...f[order._id], feedbackComment: e.target.value } }))}
                                  placeholder="Share your thoughts..."
                                />
                              </div>
                              <button
                                type="submit"
                                className="btn-gradient text-white px-4 py-2 rounded"
                                disabled={submittingFeedback === order._id || !feedback[order._id]?.deliveryRating || !feedback[order._id]?.foodRating}
                              >
                                {submittingFeedback === order._id ? 'Submitting...' : 'Submit Feedback'}
                              </button>
                            </form>
                          </div>
                        )}
                        {/* Show feedback if already submitted */}
                        {order.status === 'delivered' && order.deliveryRating && order.foodRating && (
                          <div className="mt-4 bg-green-50 p-3 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">Your Feedback:</span>
                              <span className="flex items-center text-yellow-500">
                                {Array(order.deliveryRating).fill(0).map((_,i) => <Star key={i} className="h-4 w-4" fill="currentColor" />)}
                              </span>
                              <span className="text-xs text-gray-500">Delivery</span>
                              <span className="flex items-center text-yellow-500 ml-4">
                                {Array(order.foodRating).fill(0).map((_,i) => <Star key={i} className="h-4 w-4" fill="currentColor" />)}
                              </span>
                              <span className="text-xs text-gray-500">Food</span>
                            </div>
                            {order.feedbackComment && (
                              <div className="mt-1 text-sm text-gray-700">"{order.feedbackComment}"</div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                    <p className="text-gray-600">Start ordering delicious food to see your history here!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
