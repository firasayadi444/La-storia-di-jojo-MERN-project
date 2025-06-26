import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const Cart: React.FC = () => {
  const { items, updateQuantity, removeFromCart, getTotalPrice } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

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

  const total = getTotalPrice();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Cart is Empty</h2>
          <p className="text-gray-600 mb-6">Start adding some delicious food to your cart!</p>
          <Button asChild className="btn-gradient text-white">
            <Link to="/">Browse Food</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Cart</h1>
          <p className="text-gray-600">{items.length} item{items.length !== 1 ? 's' : ''} in your cart</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.food._id} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <img
                      src={item.food.image}
                      alt={item.food.name}
                      className="w-20 h-20 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = `https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=80&h=80&fit=crop`;
                      }}
                    />
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900">{item.food.name}</h3>
                      <p className="text-gray-600 text-sm">{item.food.category}</p>
                      <p className="text-food-orange-600 font-bold text-lg">€{item.food.price.toFixed(2)}</p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Button
                        onClick={() => updateQuantity(item.food._id, item.quantity - 1)}
                        variant="outline"
                        size="sm"
                        className="w-8 h-8 rounded-full p-0"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="font-medium text-lg w-8 text-center">{item.quantity}</span>
                      <Button
                        onClick={() => updateQuantity(item.food._id, item.quantity + 1)}
                        variant="outline"
                        size="sm"
                        className="w-8 h-8 rounded-full p-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <Button
                      onClick={() => removeFromCart(item.food._id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8 shadow-xl">
              <CardContent className="p-6">
                <h3 className="font-bold text-xl text-gray-900 mb-6">Order Summary</h3>
                
                <div className="space-y-3 mb-6">
                  {items.map((item) => (
                    <div key={item.food._id} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.food.name} x {item.quantity}
                      </span>
                      <span className="font-medium">
                        €{(item.food.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total:</span>
                    <span className="text-2xl font-bold text-food-orange-600">
                      €{total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => navigate('/checkout')}
                  className="w-full btn-gradient text-white py-3 text-lg font-semibold"
                >
                  Proceed to Checkout
                </Button>

                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="w-full mt-3"
                >
                  Continue Shopping
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
