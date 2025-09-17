import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingCart, ArrowLeft, CreditCard, Banknote, Sparkles } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const Cart: React.FC = () => {
  const { items, updateQuantity, removeFromCart, getTotalPrice } = useCart();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [removingItem, setRemovingItem] = useState<string | null>(null);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Login</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to view your cart.</p>
          <Button asChild className="btn-gradient text-white">
            <Link to="/login">Login</Link>
          </Button>
        </Card>
      </div>
    );
  }

  if (user?.role !== 'user') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Restricted</h2>
          <p className="text-gray-600 mb-6">
            {user?.role === 'admin' ? 'Admins cannot place orders' : 'Delivery personnel cannot place orders'}
          </p>
          <p className="text-gray-600 mb-6">Only customers can access the cart and place orders.</p>
          <Button asChild className="btn-gradient text-white">
            <Link to="/">Return to Menu</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const total = getTotalPrice();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <div className="relative mb-6">
            <ShoppingCart className="h-20 w-20 text-orange-400 mx-auto mb-4 animate-bounce" />
            <Sparkles className="h-6 w-6 text-yellow-400 absolute -top-2 -right-2 animate-pulse" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Your Cart is Empty</h2>
          <p className="text-gray-600 mb-8 text-lg">Start adding some delicious food to your cart!</p>
          <div className="space-y-3">
            <Button asChild className="w-full btn-gradient text-white py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
              <Link to="/" className="flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5" />
                Browse Delicious Food
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/" className="flex items-center justify-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Menu
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const handleRemoveItem = async (foodId: string) => {
    setRemovingItem(foodId);
    // Add a small delay for animation
    setTimeout(() => {
      removeFromCart(foodId);
      setRemovingItem(null);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <ShoppingCart className="h-8 w-8 text-orange-600" />
            <h1 className="text-4xl font-bold text-gray-900">Your Cart</h1>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {items.length} item{items.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          <p className="text-gray-600 text-lg">Review your delicious selections</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {items.map((item, index) => (
              <Card 
                key={item.food._id} 
                className={`overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${
                  removingItem === item.food._id ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-6">
                    {/* Food Image */}
                    <div className="relative">
                      <img
                        src={item.food.image}
                        alt={item.food.name}
                        className="w-24 h-24 object-cover rounded-xl shadow-md"
                        onError={(e) => {
                          e.currentTarget.src = `https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=96&h=96&fit=crop`;
                        }}
                      />
                      <Badge className="absolute -top-2 -right-2 bg-orange-500 text-white">
                        {item.quantity}
                      </Badge>
                    </div>
                    
                    {/* Food Details */}
                    <div className="flex-1">
                      <h3 className="font-bold text-xl text-gray-900 mb-1">{item.food.name}</h3>
                      <p className="text-gray-600 text-sm mb-2 capitalize">{item.food.category}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-orange-600 font-bold text-xl">€{item.food.price.toFixed(2)}</span>
                        <span className="text-gray-400">each</span>
                      </div>
                      <div className="text-lg font-semibold text-gray-800 mt-2">
                        Total: €{(item.food.price * item.quantity).toFixed(2)}
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex flex-col items-center space-y-3">
                      <div className="flex items-center space-x-3 bg-gray-50 rounded-full p-2">
                        <Button
                          onClick={() => updateQuantity(item.food._id, item.quantity - 1)}
                          variant="outline"
                          size="sm"
                          className="w-10 h-10 rounded-full p-0 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="font-bold text-lg w-8 text-center bg-white px-3 py-1 rounded-full">
                          {item.quantity}
                        </span>
                        <Button
                          onClick={() => updateQuantity(item.food._id, item.quantity + 1)}
                          variant="outline"
                          size="sm"
                          className="w-10 h-10 rounded-full p-0 hover:bg-green-50 hover:border-green-300 hover:text-green-600 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <Button
                        onClick={() => handleRemoveItem(item.food._id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                        disabled={removingItem === item.food._id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8 shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <ShoppingCart className="h-6 w-6" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {/* Items List */}
                <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.food._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{item.food.name}</p>
                        <p className="text-gray-600 text-xs">x {item.quantity}</p>
                      </div>
                      <span className="font-bold text-orange-600">
                        €{(item.food.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Payment Methods Preview */}
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Payment Options
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CreditCard className="h-4 w-4 text-blue-600" />
                      <span>Credit/Debit Card</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Banknote className="h-4 w-4 text-green-600" />
                      <span>Cash on Delivery</span>
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div className="border-t-2 border-orange-200 pt-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-gray-900">Total:</span>
                    <span className="text-3xl font-bold text-orange-600">
                      €{total.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Including all taxes</p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={() => navigate('/checkout')}
                    className="w-full btn-gradient text-white py-4 text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    <CreditCard className="h-5 w-5 mr-2" />
                    Proceed to Checkout
                  </Button>

                  <Button
                    onClick={() => navigate('/')}
                    variant="outline"
                    className="w-full py-3 hover:bg-orange-50 hover:border-orange-300 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Continue Shopping
                  </Button>
                </div>

                {/* Security Badge */}
                <div className="mt-6 text-center">
                  <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Secure checkout with SSL encryption
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
