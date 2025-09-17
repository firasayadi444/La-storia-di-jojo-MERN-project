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
import { CheckCircle } from 'lucide-react';

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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
          <p className="text-gray-600">Complete your order</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Form */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Delivery Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={orderData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={orderData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Delivery Address</Label>
                  <Input
                    id="address"
                    name="address"
                    value={orderData.address}
                    onChange={handleInputChange}
                    placeholder="Enter your full delivery address"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={orderData.phone}
                    onChange={handleInputChange}
                    placeholder="Your contact number"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Special Instructions (Optional)</Label>
                  <Input
                    id="notes"
                    name="notes"
                    value={orderData.notes}
                    onChange={handleInputChange}
                    placeholder="Any special delivery instructions..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 cursor-pointer p-2 border rounded-md hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={paymentMethod === 'card'}
                        onChange={() => setPaymentMethod('card')}
                        className="accent-food-orange-600"
                      />
                      <span className="text-lg">💳 Pay with Card</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-2 border rounded-md hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash"
                        checked={paymentMethod === 'cash'}
                        onChange={() => setPaymentMethod('cash')}
                        className="accent-food-orange-600"
                      />
                      <span className="text-lg">💵 Pay with Cash (Espèce)</span>
                    </label>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-gradient text-white py-3 text-lg font-semibold mt-6"
                >
                  {isLoading
                    ? 'Placing Order...'
                    : `Place Order - €${total.toFixed(2)}`}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card className="shadow-lg h-fit">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.food._id} className="flex items-center space-x-4 pb-4 border-b border-gray-200">
                    <img
                      src={item.food.image}
                      alt={item.food.name}
                      className="w-16 h-16 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = `https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=64&h=64&fit=crop`;
                      }}
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.food.name}</h4>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      <p className="text-sm font-medium text-food-orange-600">
                        €{(item.food.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}

                <div className="pt-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-food-orange-600">€{total.toFixed(2)}</span>
                  </div>
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
