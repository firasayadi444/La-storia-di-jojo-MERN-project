import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, Heart, Share2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiService, Food } from '../services/api';

const FoodDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [food, setFood] = useState<Food | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    const fetchFood = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await apiService.getFoodDetails(id);
        setFood(response.food || response.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load food details');
      } finally {
        setLoading(false);
      }
    };

    fetchFood();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-italian-cream-50 to-white flex items-center justify-center">
        <Card className="p-8 text-center card-warm max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-italian-green-700 mx-auto mb-4"></div>
          <h2 className="text-2xl font-serif font-bold text-italian-green-800 mb-4">Caricamento...</h2>
          <p className="text-italian-green-700">Loading your delicious dish...</p>
        </Card>
      </div>
    );
  }

  if (error || !food) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-italian-cream-50 to-white flex items-center justify-center">
        <Card className="p-8 text-center card-warm max-w-md">
          <span className="text-6xl mb-4 block">😕</span>
          <h2 className="text-2xl font-serif font-bold text-italian-green-800 mb-4">Piatto Non Trovato</h2>
          <p className="text-italian-green-700 mb-6">
            {error || "This delicious dish seems to have wandered off from our menu."}
          </p>
          <Button onClick={() => navigate('/')} className="btn-gradient text-white">
            Return to Menu
          </Button>
        </Card>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    for (let i = 0; i < quantity; i++) {
      addToCart(food);
    }
    
    toast({
      title: "Aggiunto al carrello!",
      description: `${quantity} x ${food.name} added to your cart with amore`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-italian-cream-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          onClick={() => navigate(-1)}
          variant="ghost"
          className="mb-6 flex items-center space-x-2 text-italian-green-700 hover:text-italian-green-800 hover:bg-italian-cream-100 transition-all duration-300"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Torna al Menu</span>
        </Button>

        {/* Hero Section */}
        <div className="relative mb-12">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl recipe-hero">
            <img
              src={food.image}
              alt={food.name}
              className="w-full h-[400px] lg:h-[500px] object-cover transition-transform duration-700 hover:scale-105"
              onError={(e) => {
                e.currentTarget.src = `https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=1200&h=500&fit=crop`;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
            
            {/* Overlay Content */}
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <Badge className="recipe-badge text-italian-green-700 font-medium">
                  {food.category}
                </Badge>
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-serif font-bold mb-4 animate-fade-in">
                {food.name}
              </h1>
              
              <p className="text-lg opacity-90 max-w-2xl leading-relaxed animate-slide-up">
                {food.description}
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="absolute top-6 right-6 flex gap-3">
              <Button
                onClick={() => setIsFavorited(!isFavorited)}
                variant="ghost"
                size="sm"
                className={`rounded-full w-12 h-12 recipe-favorite-btn ${
                  isFavorited 
                    ? 'bg-red-500 text-white hover:bg-red-600 favorited' 
                    : 'bg-white/90 text-gray-700 hover:bg-white'
                }`}
              >
                <Heart className={`h-5 w-5 ${isFavorited ? 'fill-current' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full w-12 h-12 bg-white/90 text-gray-700 hover:bg-white recipe-action-btn"
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Recipe Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Simple Description Card */}
            <Card className="p-8 shadow-lg border-0 glass-card-food animate-fade-in">
              <div className="space-y-6">
                <p className="text-italian-green-700 text-lg leading-relaxed font-light">
                  {food.description}
                </p>
              </div>
            </Card>
          </div>

          {/* Right Column - Order Card */}
          <div className="lg:col-span-1">
            <Card className="p-8 shadow-xl border-0 glass-card-food sticky top-8 recipe-card-hover">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-italian-green-700 mb-2 recipe-price-glow px-4 py-2 rounded-lg">
                    €{food.price.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">per serving</div>
                </div>

                {/* Quantity Selector */}
                <div>
                  <label className="block text-sm font-medium text-italian-green-800 mb-3">
                    Quantity
                  </label>
                  <div className="flex items-center justify-center space-x-4">
                    <Button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      variant="outline"
                      size="sm"
                      className="w-12 h-12 rounded-full border-italian-green-300 hover:bg-italian-green-50"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-2xl font-bold w-12 text-center text-italian-green-800">
                      {quantity}
                    </span>
                    <Button
                      onClick={() => setQuantity(quantity + 1)}
                      variant="outline"
                      size="sm"
                      className="w-12 h-12 rounded-full border-italian-green-300 hover:bg-italian-green-50"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Total Price */}
                <div className="p-4 bg-italian-cream-100 rounded-lg border border-italian-cream-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-italian-green-800">Total:</span>
                    <span className="text-2xl font-bold text-italian-green-700">
                      €{(food.price * quantity).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Add to Cart Button */}
                {user?.role === 'user' ? (
                  <Button
                    onClick={handleAddToCart}
                    className="w-full btn-gradient text-white py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add to Cart
                  </Button>
                ) : (
                  <Button
                    onClick={handleAddToCart}
                    className="w-full btn-gradient text-white py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add to Cart
                  </Button>
                )}

                {!isAuthenticated && (
                  <Button
                    onClick={() => navigate('/login')}
                    className="w-full btn-gradient text-white py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  >
                    Login to Order
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodDetail;
