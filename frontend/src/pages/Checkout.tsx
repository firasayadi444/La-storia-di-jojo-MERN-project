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
import { CheckCircle, CreditCard, Banknote, ArrowLeft, Shield, Clock, MapPin, User, Phone, Mail, Sparkles, Navigation, MessageCircle } from 'lucide-react';

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
            <Card className="shadow-lg border-2 border-italian-green-100">
              <CardHeader className="bg-gradient-to-r from-italian-green-50 to-blue-50 border-b border-italian-green-200">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 bg-gradient-to-r from-italian-green-500 to-blue-500 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <span className="text-gray-900">Delivery Information</span>
                    <p className="text-sm font-normal text-gray-600 mt-1">Complete your delivery details</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 bg-gradient-to-br from-white to-gray-50">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Personal Details</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <User className="h-4 w-4 text-gray-500" />
                          Full Name *
                        </Label>
                        <Input
                          id="name"
                          name="name"
                          value={orderData.name}
                          onChange={handleInputChange}
                          required
                          className="w-full border-2 border-gray-200 focus:border-italian-green-500 focus:ring-2 focus:ring-italian-green-200 transition-all duration-200"
                          placeholder="Enter your full name"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <Mail className="h-4 w-4 text-gray-500" />
                          Email Address *
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={orderData.email}
                          onChange={handleInputChange}
                          required
                          className="w-full border-2 border-gray-200 focus:border-italian-green-500 focus:ring-2 focus:ring-italian-green-200 transition-all duration-200"
                          placeholder="Enter your email"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Phone className="h-4 w-4 text-gray-500" />
                      Phone Number *
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={orderData.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full border-2 border-gray-200 focus:border-italian-green-500 focus:ring-2 focus:ring-italian-green-200 transition-all duration-200"
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Delivery Location</h3>
                    </div>
                    
                    <div className="space-y-3">
                      {selectedLocation ? (
                        <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl shadow-sm">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <MapPin className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-green-800">Location Selected ✓</p>
                              <p className="text-xs text-green-600">Ready for delivery</p>
                            </div>
                          </div>
                          <div className="bg-white rounded-lg p-4 border border-green-100">
                            <p className="text-green-700 font-medium mb-2">{selectedLocation.address}</p>
                            <div className="flex items-center gap-4 text-xs text-green-600">
                              <span className="flex items-center gap-1">
                                <Navigation className="h-3 w-3" />
                                ±{Math.round(selectedLocation.accuracy)}m accuracy
                              </span>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowLocationPicker(true)}
                            className="mt-3 flex items-center gap-2 border-green-300 text-green-700 hover:bg-green-100"
                          >
                            <Navigation className="h-4 w-4" />
                            Change Location
                          </Button>
                        </div>
                      ) : (
                        <div className="p-6 border-2 border-dashed border-gray-300 rounded-xl text-center bg-gray-50">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MapPin className="h-8 w-8 text-gray-400" />
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">Select Delivery Location</h4>
                          <p className="text-gray-600 mb-4">Choose where you want your order delivered</p>
                          <Button
                            type="button"
                            onClick={() => setShowLocationPicker(true)}
                            className="bg-italian-green-600 hover:bg-italian-green-700 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                          >
                            <Navigation className="h-5 w-5 mr-2" />
                            Choose Location
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <MessageCircle className="h-4 w-4 text-purple-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Special Instructions</h3>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                        Delivery Notes (Optional)
                      </Label>
                      <textarea
                        id="notes"
                        name="notes"
                        value={orderData.notes}
                        onChange={handleInputChange}
                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-italian-green-500 focus:ring-2 focus:ring-italian-green-200 transition-all duration-200 resize-none"
                        rows={3}
                        placeholder="Any special instructions for delivery... (e.g., 'Leave at door', 'Call when arriving', etc.)"
                      />
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Shield className="h-4 w-4 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Payment Method</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div
                        className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                          paymentMethod === 'card'
                            ? 'border-italian-green-500 bg-gradient-to-r from-italian-green-50 to-green-50 shadow-lg'
                            : 'border-gray-200 hover:border-italian-green-300 hover:shadow-md bg-white'
                        }`}
                        onClick={() => setPaymentMethod('card')}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            paymentMethod === 'card' ? 'bg-italian-green-100' : 'bg-blue-100'
                          }`}>
                            <CreditCard className={`h-6 w-6 ${
                              paymentMethod === 'card' ? 'text-italian-green-600' : 'text-blue-600'
                            }`} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-1">Credit/Debit Card</h4>
                            <p className="text-sm text-gray-600">Secure payment with Stripe</p>
                            {paymentMethod === 'card' && (
                              <div className="flex items-center gap-1 mt-2">
                                <Shield className="h-3 w-3 text-italian-green-600" />
                                <span className="text-xs text-italian-green-600 font-medium">Selected</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div
                        className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                          paymentMethod === 'cash'
                            ? 'border-italian-green-500 bg-gradient-to-r from-italian-green-50 to-green-50 shadow-lg'
                            : 'border-gray-200 hover:border-italian-green-300 hover:shadow-md bg-white'
                        }`}
                        onClick={() => setPaymentMethod('cash')}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            paymentMethod === 'cash' ? 'bg-italian-green-100' : 'bg-green-100'
                          }`}>
                            <Banknote className={`h-6 w-6 ${
                              paymentMethod === 'cash' ? 'text-italian-green-600' : 'text-green-600'
                            }`} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-1">Cash on Delivery</h4>
                            <p className="text-sm text-gray-600">Pay when your order arrives</p>
                            {paymentMethod === 'cash' && (
                              <div className="flex items-center gap-1 mt-2">
                                <Shield className="h-3 w-3 text-italian-green-600" />
                                <span className="text-xs text-italian-green-600 font-medium">Selected</span>
                              </div>
                            )}
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