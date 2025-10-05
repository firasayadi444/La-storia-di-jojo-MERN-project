import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import ModernPaymentModal from '@/components/ModernPaymentModal';
import LocationPicker from '@/components/LocationPicker';
import { forceClearCart } from '@/utils/cartUtils';
import { CheckCircle, CreditCard, Banknote, ArrowLeft, Shield, Clock, MapPin, User, Phone, Mail, Sparkles, Navigation } from 'lucide-react';

const Checkout: React.FC = () => {
  const { items, getTotalPrice, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [orderData, setOrderData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
    accuracy: number;
  } | null>(null);

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  if (user?.role !== 'user') {
    navigate('/');
    return null;
  }

  // Debug cart persistence
  useEffect(() => {
    console.log('🛒 Checkout - Cart items:', items);
    console.log('🛒 Checkout - Cart length:', items.length);
    console.log('🛒 Checkout - Auth status:', isAuthenticated);
    console.log('🛒 Checkout - User role:', user?.role);
  }, [items, isAuthenticated, user?.role]);

  if (items.length === 0) {
    console.log('🛒 Checkout - Redirecting to cart (empty cart)');
    navigate('/cart');
    return null;
  }

  const total = getTotalPrice();

  // Update order data when user data changes
  useEffect(() => {
    if (user) {
      setOrderData(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone
      }));
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setOrderData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if phone number is provided first
    if (!orderData.phone?.trim()) {
      toast({
        title: "Phone Required",
        description: "Please provide your phone number to place an order",
        variant: "destructive"
      });
      return;
    }

    // Check if location is selected
    if (!selectedLocation) {
      toast({
        title: "Location Required",
        description: "Please select your delivery location to place an order",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const deliveryTime = new Date();
      deliveryTime.setMinutes(deliveryTime.getMinutes() + 30); // 30 minutes from now

      const orderPayload = {
        items: items.map(item => ({
          food: item.food._id,
          quantity: item.quantity,
          price: item.food.price
        })),
        totalAmount: total,
        deliveryAddress: selectedLocation.address,
        paymentMethod: paymentMethod,
        status: paymentMethod === 'card' ? 'pending_payment' : 'pending',
        deliveryNotes: orderData.notes,
        estimatedDeliveryTime: deliveryTime.toISOString(),
        customerLocation: selectedLocation ? {
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          accuracy: selectedLocation.accuracy
        } : {
          latitude: 36.8065, // Default Tunis coordinates
          longitude: 10.1815,
          accuracy: 100
        }
      };

      if (paymentMethod === 'card') {
        const orderResponse = await apiService.makeOrder(orderPayload);
        
        if (orderResponse.order) {
          localStorage.setItem('pendingOrderId', orderResponse.order._id);
          setShowPayment(true);
        } else {
          throw new Error('Failed to create order');
        }
      } else {
        // Cash payment
        const orderResponse = await apiService.makeOrder(orderPayload);
        
        if (orderResponse.order) {
          toast({
            title: "Order Placed Successfully!",
            description: "Your order has been placed and will be prepared shortly.",
            duration: 5000
          });
          
          clearCart();
          localStorage.removeItem('checkoutFormData');
          localStorage.removeItem('pendingOrderData');
          
          // Double check that cart is cleared
          setTimeout(() => {
            console.log('🛒 Verifying cart is cleared after order...');
            const remainingCart = localStorage.getItem('cart');
            if (remainingCart) {
              console.log('🛒 Cart still exists, forcing clear...');
              forceClearCart();
            }
          }, 100);
          
          navigate('/orders');
        } else {
          throw new Error('Failed to create order');
        }
      }
    } catch (error: any) {
      console.error('Order creation error:', error);
      toast({
        title: "Order Failed",
        description: error.message || "Failed to place order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    toast({
      title: "Payment Successful!",
      description: "Your order has been placed and payment processed successfully.",
      duration: 5000
    });
    
    clearCart();
    localStorage.removeItem('checkoutFormData');
    localStorage.removeItem('pendingOrderData');
    localStorage.removeItem('pendingOrderId');
    
    // Double check that cart is cleared
    setTimeout(() => {
      console.log('🛒 Verifying cart is cleared after payment...');
      const remainingCart = localStorage.getItem('cart');
      if (remainingCart) {
        console.log('🛒 Cart still exists, forcing clear...');
        forceClearCart();
      }
    }, 100);
    
    navigate('/orders');
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: "Payment Failed",
      description: error,
      variant: "destructive"
    });
  };

  const deliveryTime = new Date();
  deliveryTime.setMinutes(deliveryTime.getMinutes() + 30);

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-italian-cream-50 to-italian-green-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => navigate('/cart')}
            className="mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Cart
          </Button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-italian-green-600" />
            Checkout
          </h1>
          <p className="text-gray-600">Complete your order and get ready for delicious food!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-italian-green-600 to-italian-green-700 text-white">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-6 w-6" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.food.name}</h4>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          ${(item.food.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-4 border-t-2 border-italian-green-200">
                    <div className="flex justify-between items-center text-lg font-bold text-gray-900">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-italian-cream-50 p-3 rounded-lg">
                    <Clock className="h-4 w-4 text-italian-green-600" />
                    <span>Estimated delivery: {deliveryTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <User className="h-6 w-6 text-blue-600" />
                  Delivery Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name" className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4" />
                        Full Name *
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        value={orderData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full"
                        placeholder="Enter your full name"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                        <Mail className="h-4 w-4" />
                        Email *
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={orderData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-2 mb-2">
                      <Phone className="h-4 w-4" />
                      Phone Number *
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={orderData.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full"
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4" />
                      Delivery Location *
                    </Label>
                    <div className="space-y-3">
                      {selectedLocation ? (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2 text-sm text-green-700 mb-2">
                            <MapPin className="h-4 w-4" />
                            <span className="font-medium">Selected Location:</span>
                          </div>
                          <p className="text-green-600 mb-1">{selectedLocation.address}</p>
                          <p className="text-xs text-green-500">
                            Accuracy: ±{Math.round(selectedLocation.accuracy)}m
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowLocationPicker(true)}
                            className="mt-2 flex items-center gap-2"
                          >
                            <Navigation className="h-4 w-4" />
                            Change Location
                          </Button>
                        </div>
                      ) : (
                        <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                          <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-600 mb-3">No delivery location selected</p>
                          <Button
                            type="button"
                            onClick={() => setShowLocationPicker(true)}
                            className="bg-italian-green-600 hover:bg-italian-green-700 text-white"
                          >
                            <Navigation className="h-4 w-4 mr-2" />
                            Select Delivery Location
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes" className="mb-2">
                      Delivery Notes (Optional)
                    </Label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={orderData.notes}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-italian-green-500 focus:border-transparent"
                      rows={3}
                      placeholder="Any special instructions for delivery..."
                    />
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-green-600" />
                      Payment Method
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          paymentMethod === 'card'
                            ? 'border-italian-green-500 bg-italian-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setPaymentMethod('card')}
                      >
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-6 w-6 text-blue-600" />
                          <div>
                            <h4 className="font-medium text-gray-900">Credit/Debit Card</h4>
                            <p className="text-sm text-gray-600">Secure payment with Stripe</p>
                          </div>
                        </div>
                      </div>
                      
                      <div
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          paymentMethod === 'cash'
                            ? 'border-italian-green-500 bg-italian-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setPaymentMethod('cash')}
                      >
                        <div className="flex items-center gap-3">
                          <Banknote className="h-6 w-6 text-green-600" />
                          <div>
                            <h4 className="font-medium text-gray-900">Cash on Delivery</h4>
                            <p className="text-sm text-gray-600">Pay when your order arrives</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-6">
                    <Button
                      type="submit"
                      disabled={isLoading || !orderData.phone?.trim() || !selectedLocation}
                      className="w-full btn-gradient text-white py-4 text-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 mt-8 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {isLoading ? (
                        <>
                          <Clock className="h-5 w-5 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : !orderData.phone?.trim() ? (
                        <>
                          <Phone className="h-5 w-5 mr-2" />
                          Phone Required
                        </>
                      ) : !selectedLocation ? (
                        <>
                          <MapPin className="h-5 w-5 mr-2" />
                          Location Required
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5 mr-2" />
                          {paymentMethod === 'card' ? 'Proceed to Payment' : 'Place Order'}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modern Payment Modal */}
      <ModernPaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        orderId={localStorage.getItem('pendingOrderId') || ''}
        totalAmount={total}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={handlePaymentError}
      />

      {/* Location Picker Modal */}
      <LocationPicker
        isOpen={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onLocationSelect={(location) => {
          setSelectedLocation(location);
          setShowLocationPicker(false);
        }}
        initialLocation={selectedLocation || undefined}
      />
    </div>
    </>
  );
};

export default Checkout;