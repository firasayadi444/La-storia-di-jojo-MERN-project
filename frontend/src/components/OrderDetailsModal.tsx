import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Truck, 
  Package, 
  CreditCard,
  Star,
  MessageSquare,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';

interface OrderItem {
  _id: string;
  food: {
    _id: string;
    name: string;
    price: number;
    image?: string;
    category: string;
    description?: string;
  };
  quantity: number;
  price: number;
}

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
}

interface DeliveryMan {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  vehicleType?: string;
  currentLocation?: {
    coordinates: [number, number];
    lastUpdated: string;
  };
}

interface Payment {
  _id: string;
  paymentMethod: string;
  paymentStatus: string;
  paidAt?: string;
}

interface OrderDetails {
  _id: string;
  user: Customer;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  deliveryAddress: string;
  customerLocation: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: string;
  };
  deliveryMan?: DeliveryMan;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  deliveryNotes?: string;
  deliveryRating?: number;
  foodRating?: number;
  feedbackComment?: string;
  assignedAt?: string;
  createdAt: string;
  updatedAt: string;
  payment?: Payment;
}

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  isOpen,
  onClose,
  orderId
}) => {
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails();
    }
  }, [isOpen, orderId]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      const response = await apiService.getOrderDetails(orderId);
      setOrderDetails(response.data);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les détails de la commande",
        variant: "destructive",
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
      case 'ready': return 'bg-green-100 text-green-800';
      case 'out_for_delivery': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-emerald-100 text-emerald-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'confirmed': return 'Confirmée';
      case 'preparing': return 'En préparation';
      case 'ready': return 'Prête';
      case 'out_for_delivery': return 'En livraison';
      case 'delivered': return 'Livrée';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Chargement des détails...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!orderDetails) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="text-center py-8">
            <p className="text-gray-500">Aucun détail de commande trouvé</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Détails de la Commande #{orderDetails._id.slice(-6)}</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Informations Générales</span>
                <Badge className={getStatusColor(orderDetails.status)}>
                  {getStatusText(orderDetails.status)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Créée le:</span>
                  <span className="font-medium">{formatDate(orderDetails.createdAt)}</span>
                </div>
                {orderDetails.estimatedDeliveryTime && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Livraison estimée:</span>
                    <span className="font-medium">{formatDate(orderDetails.estimatedDeliveryTime)}</span>
                  </div>
                )}
                {orderDetails.actualDeliveryTime && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Livrée le:</span>
                    <span className="font-medium">{formatDate(orderDetails.actualDeliveryTime)}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-green-600">
                  Total: €{orderDetails.totalAmount.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informations Client
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{orderDetails.user.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{orderDetails.user.email}</span>
              </div>
              {orderDetails.user.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{orderDetails.user.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{orderDetails.deliveryAddress}</span>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Produits Commandés ({orderDetails.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orderDetails.items.map((item, index) => (
                  <div key={item._id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{item.food.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">{item.food.category}</p>
                        {item.food.description && (
                          <p className="text-sm text-gray-500 mb-2">{item.food.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Package className="h-4 w-4" />
                            Quantité: {item.quantity}
                          </span>
                          <span className="font-medium">
                            Prix unitaire: €{item.food.price.toFixed(2)}
                          </span>
                          <span className="font-bold text-green-600">
                            Sous-total: €{item.price.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      {item.food.image && (
                        <img
                          src={item.food.image}
                          alt={item.food.name}
                          className="w-16 h-16 object-cover rounded-lg ml-4"
                          onError={(e) => {
                            e.currentTarget.src = `https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=64&h=64&fit=crop`;
                          }}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Delivery Information */}
          {orderDetails.deliveryMan && orderDetails.deliveryMan._id && orderDetails.deliveryMan.name && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Informations Livreur
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{orderDetails.deliveryMan.name}</span>
                </div>
                {orderDetails.deliveryMan.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{orderDetails.deliveryMan.phone}</span>
                  </div>
                )}
                {orderDetails.deliveryMan.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{orderDetails.deliveryMan.email}</span>
                  </div>
                )}
                {orderDetails.deliveryMan.vehicleType && (
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Véhicule: {orderDetails.deliveryMan.vehicleType}</span>
                  </div>
                )}
                {orderDetails.assignedAt && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Assigné le: {formatDate(orderDetails.assignedAt)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* No Delivery Man Assigned */}
          {(!orderDetails.deliveryMan || !orderDetails.deliveryMan._id || !orderDetails.deliveryMan.name) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Informations Livraison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-amber-600">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Aucun livreur assigné pour le moment</span>
                </div>
                {orderDetails.status === 'ready' && (
                  <div className="mt-2 text-xs text-gray-500">
                    La commande est prête et en attente d'assignation d'un livreur
                  </div>
                )}
                {orderDetails.status === 'preparing' && (
                  <div className="mt-2 text-xs text-gray-500">
                    La commande est en préparation
                  </div>
                )}
                {orderDetails.status === 'pending' && (
                  <div className="mt-2 text-xs text-gray-500">
                    La commande est en attente de confirmation
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payment Information */}
          {orderDetails.payment && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Informations Paiement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Méthode:</span>
                  <span className="font-medium">{orderDetails.payment.paymentMethod}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Statut:</span>
                  <Badge className={
                    orderDetails.payment.paymentStatus === 'paid' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }>
                    {orderDetails.payment.paymentStatus === 'paid' ? 'Payé' : 'En attente'}
                  </Badge>
                </div>
                {orderDetails.payment.paidAt && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Payé le: {formatDate(orderDetails.payment.paidAt)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Delivery Notes */}
          {orderDetails.deliveryNotes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Notes de Livraison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">{orderDetails.deliveryNotes}</p>
              </CardContent>
            </Card>
          )}

          {/* Feedback */}
          {(orderDetails.deliveryRating || orderDetails.foodRating || orderDetails.feedbackComment) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Avis Client
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {orderDetails.foodRating && (
                  <div>
                    <span className="text-sm text-gray-600">Note nourriture:</span>
                    <div className="flex items-center gap-1 mt-1">
                      {renderStars(orderDetails.foodRating)}
                      <span className="ml-2 text-sm">({orderDetails.foodRating}/5)</span>
                    </div>
                  </div>
                )}
                {orderDetails.deliveryRating && (
                  <div>
                    <span className="text-sm text-gray-600">Note livraison:</span>
                    <div className="flex items-center gap-1 mt-1">
                      {renderStars(orderDetails.deliveryRating)}
                      <span className="ml-2 text-sm">({orderDetails.deliveryRating}/5)</span>
                    </div>
                  </div>
                )}
                {orderDetails.feedbackComment && (
                  <div>
                    <span className="text-sm text-gray-600">Commentaire:</span>
                    <p className="text-sm text-gray-700 mt-1 p-3 bg-gray-50 rounded-lg">
                      {orderDetails.feedbackComment}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsModal;
