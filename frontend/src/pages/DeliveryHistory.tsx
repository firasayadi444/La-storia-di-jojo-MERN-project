import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  MapPin, 
  Clock, 
  Truck, 
  User, 
  Phone, 
  Star,
  Calendar,
  Route,
  TrendingUp,
  Package,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface DeliveryHistoryItem {
  _id: string;
  orderId: {
    _id: string;
    totalAmount: number;
    items: Array<{
      food: { name: string };
      quantity: number;
      price: number;
    }>;
    status: string;
  };
  customerId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  pickupLocation: {
    latitude: number;
    longitude: number;
    address: string;
    timestamp: string;
  };
  deliveryLocation: {
    latitude: number;
    longitude: number;
    address: string;
    timestamp: string;
  };
  totalDistance: number;
  totalTime: number;
  averageSpeed: number;
  deliveryRating: number;
  deliveryNotes: string;
  statusHistory: Array<{
    status: string;
    timestamp: string;
    location?: {
      latitude: number;
      longitude: number;
    };
    notes: string;
  }>;
  assignedAt: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  completedAt?: string;
}

interface DeliveryStats {
  totalDeliveries: number;
  completedDeliveries: number;
  averageRating: number;
  totalDistance: number;
  totalTime: number;
  averageSpeed: number;
}

const DeliveryHistory: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [deliveryHistories, setDeliveryHistories] = useState<DeliveryHistoryItem[]>([]);
  const [stats, setStats] = useState<DeliveryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'delivery') {
      return;
    }
    fetchDeliveryHistory();
    fetchDeliveryStats();
  }, [isAuthenticated, user, selectedPeriod, currentPage]);

  const fetchDeliveryHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/delivery-history?page=${currentPage}&limit=10&period=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch delivery history');
      }

      const data = await response.json();
      setDeliveryHistories(data.deliveryHistories || []);
      setTotalPages(data.totalPages || 1);
    } catch (error: any) {
      console.error('Error fetching delivery history:', error);
      toast({
        title: "Error",
        description: "Failed to load delivery history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryStats = async () => {
    try {
      const response = await fetch(`/api/delivery-history/stats?period=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch delivery stats');
      }

      const data = await response.json();
      setStats(data.stats);
    } catch (error: any) {
      console.error('Error fetching delivery stats:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      assigned: { color: 'bg-blue-100 text-blue-800', icon: Package },
      picked_up: { color: 'bg-yellow-100 text-yellow-800', icon: Truck },
      in_transit: { color: 'bg-purple-100 text-purple-800', icon: Route },
      delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      failed: { color: 'bg-red-100 text-red-800', icon: AlertCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.assigned;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${meters}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (!isAuthenticated || user?.role !== 'delivery') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You need to be logged in as a delivery person to view this page.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Delivery History</h1>
          <p className="text-gray-600">Track your delivery performance and history</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Deliveries</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalDeliveries}</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.completedDeliveries}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Rating</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.averageRating ? stats.averageRating.toFixed(1) : 'N/A'}
                    </p>
                  </div>
                  <Star className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Distance</p>
                    <p className="text-2xl font-bold text-gray-900">{formatDistance(stats.totalDistance)}</p>
                  </div>
                  <Route className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Period Filter */}
        <div className="mb-6">
          <div className="flex gap-2">
            {['7', '30', '90'].map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? 'default' : 'outline'}
                onClick={() => setSelectedPeriod(period)}
                size="sm"
              >
                {period} days
              </Button>
            ))}
          </div>
        </div>

        {/* Delivery History List */}
        <div className="space-y-6">
          {loading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading delivery history...</p>
              </CardContent>
            </Card>
          ) : deliveryHistories.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Deliveries Found</h3>
                <p className="text-gray-600">You haven't completed any deliveries in the selected period.</p>
              </CardContent>
            </Card>
          ) : (
            deliveryHistories.map((delivery) => (
              <Card key={delivery._id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Order #{delivery.orderId._id.slice(-8)}
                    </CardTitle>
                    {getStatusBadge(delivery.statusHistory[delivery.statusHistory.length - 1]?.status || 'assigned')}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Customer Info */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Customer
                      </h4>
                      <p className="text-sm text-gray-600">{delivery.customerId.name}</p>
                      <p className="text-sm text-gray-600">{delivery.customerId.email}</p>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {delivery.customerId.phone}
                      </p>
                    </div>

                    {/* Delivery Info */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Delivery Details
                      </h4>
                      <p className="text-sm text-gray-600">
                        <strong>From:</strong> {delivery.pickupLocation.address}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>To:</strong> {delivery.deliveryLocation.address}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Amount:</strong> ${delivery.orderId.totalAmount.toFixed(2)}
                      </p>
                    </div>

                    {/* Performance Metrics */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Performance
                      </h4>
                      <p className="text-sm text-gray-600">
                        <strong>Distance:</strong> {formatDistance(delivery.totalDistance)}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Time:</strong> {formatTime(delivery.totalTime)}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Speed:</strong> {delivery.averageSpeed} km/h
                      </p>
                      {delivery.deliveryRating && (
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <strong>Rating:</strong> {delivery.deliveryRating}/5
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status Timeline */}
                  <div className="mt-6">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Status Timeline
                    </h4>
                    <div className="space-y-2">
                      {delivery.statusHistory.map((status, index) => (
                        <div key={index} className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          <span className="font-medium">{status.status.replace('_', ' ').toUpperCase()}</span>
                          <span className="text-gray-500">
                            {new Date(status.timestamp).toLocaleString()}
                          </span>
                          {status.notes && (
                            <span className="text-gray-600 italic">- {status.notes}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 py-2 text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryHistory;
