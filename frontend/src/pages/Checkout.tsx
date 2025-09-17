import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import StripePayment from '@/components/StripePayment';
import { CheckCircle, CreditCard, Banknote, ArrowLeft, Shield, Clock, MapPin, User, Phone, Mail, Sparkles } from 'lucide-react';

const Checkout: React.FC = () => {
  const { items, getTotalPrice, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [orderData, setOrderData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    address: user?.address || '',
    phone: '',
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  if (user?.role !== 'user') {
    navigate('/');
    return null;
  }

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const total = getTotalPrice();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOrderData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Create order data for backend
      const orderDataForBackend = {
        items: items.map(item => ({
          food: item.food._id,
          quantity: item.quantity,
          price: item.food.price
        })),
        totalAmount: total,
        deliveryAddress: orderData.address,
        paymentMethod
      };

      // Call backend API to create order
      const response = await apiService.makeOrder(orderDataForBackend);
      
      if (paymentMethod === 'card') {
        // For card payments, show Stripe payment form
        setOrderId(response.order._id);
        setShowPayment(true);
      } else {
        // For cash payments, complete the order
        clearCart();
        toast({
          title: "Order placed successfully!",
          description: `Your order for $${total.toFixed(2)} has been confirmed. You will pay cash on delivery.`,
        });
        navigate('/orders');
      }
    } catch (error: any) {
      toast({
        title: "Order failed",
        description: error.message || "There was an error placing your order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = (order: any) => {
    clearCart();
    setShowPayment(false);
    toast({
      title: "Payment Successful!",
      description: `Your order for $${total.toFixed(2)} has been confirmed and paid.`,
    });
    navigate('/orders');
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: "Payment Failed",
      description: error,
      variant: "destructive"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="h-8 w-8 text-orange-600" />
            <h1 className="text-4xl font-bold text-gray-900">Checkout</h1>
            <Shield className="h-8 w-8 text-green-600" />
          </div>
          <p className="text-gray-600 text-lg">Complete your order securely</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Form */}
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-xl">
                <MapPin className="h-6 w-6" />
                Delivery Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2 text-sm font-semibold">
                      <User className="h-4 w-4" />
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={orderData.name}
                      onChange={handleInputChange}
                      className="h-12 text-lg"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={orderData.email}
                      onChange={handleInputChange}
                      className="h-12 text-lg"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-2 text-sm font-semibold">
                    <MapPin className="h-4 w-4" />
                    Delivery Address
                  </Label>
                  <Input
                    id="address"
                    name="address"
                    value={orderData.address}
                    onChange={handleInputChange}
                    placeholder="Enter your full delivery address"
                    className="h-12 text-lg"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-semibold">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={orderData.phone}
                    onChange={handleInputChange}
                    placeholder="Your contact number"
                    className="h-12 text-lg"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="flex items-center gap-2 text-sm font-semibold">
                    <Clock className="h-4 w-4" />
                    Special Instructions (Optional)
                  </Label>
                  <Input
                    id="notes"
                    name="notes"
                    value={orderData.notes}
                    onChange={handleInputChange}
                    placeholder="Any special delivery instructions..."
                    className="h-12 text-lg"
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-lg font-semibold">Payment Method</Label>
                  <div className="grid grid-cols-1 gap-4">
                    <label className={`flex items-center gap-4 cursor-pointer p-4 border-2 rounded-xl transition-all duration-300 ${
                      paymentMethod === 'card' 
                        ? 'border-orange-500 bg-orange-50 shadow-md' 
                        : 'border-gray-200 hover:border-orange-300 hover:bg-orange-25'
                    }`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={paymentMethod === 'card'}
                        onChange={() => setPaymentMethod('card')}
                        className="accent-orange-600 w-5 h-5"
                      />
                      <CreditCard className="h-6 w-6 text-blue-600" />
                      <div>
                        <span className="text-lg font-semibold">Pay with Card</span>
                        <p className="text-sm text-gray-600">Secure payment with Stripe</p>
                      </div>
                    </label>
                    <label className={`flex items-center gap-4 cursor-pointer p-4 border-2 rounded-xl transition-all duration-300 ${
                      paymentMethod === 'cash' 
                        ? 'border-orange-500 bg-orange-50 shadow-md' 
                        : 'border-gray-200 hover:border-orange-300 hover:bg-orange-25'
                    }`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash"
                        checked={paymentMethod === 'cash'}
                        onChange={() => setPaymentMethod('cash')}
                        className="accent-orange-600 w-5 h-5"
                      />
                      <Banknote className="h-6 w-6 text-green-600" />
                      <div>
                        <span className="text-lg font-semibold">Pay with Cash</span>
                        <p className="text-sm text-gray-600">Pay when your order arrives</p>
                      </div>
                    </label>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-gradient text-white py-4 text-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 mt-8"
                >
                  {isLoading ? (
                    <>
                      <Clock className="h-5 w-5 mr-2 animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Place Order - €{total.toFixed(2)}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm h-fit">
            <CardHeader className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Sparkles className="h-6 w-6" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Items List */}
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {items.map((item, index) => (
                    <div 
                      key={item.food._id} 
                      className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="relative">
                        <img
                          src={item.food.image}
                          alt={item.food.name}
                          className="w-20 h-20 object-cover rounded-lg shadow-md"
                          onError={(e) => {
                            e.currentTarget.src = `https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=80&h=80&fit=crop`;
                          }}
                        />
                        <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                          {item.quantity}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 text-lg">{item.food.name}</h4>
                        <p className="text-sm text-gray-600 capitalize">{item.food.category}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-orange-600 font-bold text-lg">
                            €{(item.food.price * item.quantity).toFixed(2)}
                          </span>
                          <span className="text-gray-400 text-sm">
                            (€{item.food.price.toFixed(2)} each)
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Section */}
                <div className="border-t-2 border-orange-200 pt-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-lg">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-semibold">€{total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-lg">
                      <span className="text-gray-600">Delivery:</span>
                      <span className="font-semibold text-green-600">Free</span>
                    </div>
                    <div className="flex justify-between items-center text-2xl font-bold border-t pt-3">
                      <span className="text-gray-900">Total:</span>
                      <span className="text-orange-600">€{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Security Features */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-800">Secure Checkout</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Your payment information is encrypted and secure. We never store your card details.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Form */}
        {showPayment && orderId && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Complete Payment</CardTitle>
              </CardHeader>
              <CardContent>
                {paymentMethod === 'card' ? (
                  <StripePayment
                    orderId={orderId}
                    totalAmount={total}
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={handlePaymentError}
                  />
                ) : (
                  <div className="text-center py-8">
                    <div className="mb-4">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Order Placed Successfully!
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Your order has been placed and will be paid for in cash upon delivery.
                      </p>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                          <strong>Order ID:</strong> #{orderId.slice(-6)}<br/>
                          <strong>Total Amount:</strong> ${total.toFixed(2)}<br/>
                          <strong>Payment Method:</strong> Cash on Delivery
                        </p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => {
                        clearCart();
                        navigate('/orders');
                      }}
                      className="w-full"
                    >
                      View My Orders
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;
