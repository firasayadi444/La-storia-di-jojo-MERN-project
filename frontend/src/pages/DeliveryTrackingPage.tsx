import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService, Order } from '../services/api';
import { useToast } from '@/hooks/use-toast';
import DeliveryTracking from '../components/DeliveryTracking';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';

const DeliveryTrackingPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user?.role !== 'user') {
      navigate('/');
      return;
    }

    if (orderId) {
      fetchOrder();
    }
  }, [orderId, isAuthenticated, user, navigate]);

  const fetchOrder = async () => {
    if (!orderId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getUserOrders();
      const orders = response.orders || response.data || [];
      const foundOrder = orders.find((o: Order) => o._id === orderId);
      
      if (foundOrder) {
        setOrder(foundOrder);
      } else {
        setError('Order not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load order');
      toast({
        title: "Error",
        description: "Failed to load order details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchOrder();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Order Details</h2>
          <p className="text-gray-600">Please wait while we fetch your order information...</p>
        </Card>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-6">
            {error || 'The order you are looking for does not exist or you do not have permission to view it.'}
          </p>
          <div className="space-y-3">
            <Button onClick={handleRefresh} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button variant="outline" onClick={() => navigate('/orders')} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to My Orders
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => navigate('/orders')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Orders
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Your Delivery</h1>
          <p className="text-gray-600">Monitor your order in real-time</p>
        </div>

        {/* Delivery Tracking Component */}
        <DeliveryTracking 
          order={order} 
          onClose={() => navigate('/orders')}
        />

        {/* Additional Information */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Need Help?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Contact Support</h4>
                <p className="text-gray-600">
                  If you have any questions about your order, please contact our support team.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Delivery Issues</h4>
                <p className="text-gray-600">
                  If there are any issues with your delivery, please contact the delivery person directly.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DeliveryTrackingPage;
