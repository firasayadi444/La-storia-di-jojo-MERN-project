
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const FoodDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { foods, addToCart } = useApp();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quantity, setQuantity] = React.useState(1);

  const food = foods.find(f => f.id === id);

  if (!food) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-italian-cream-50 to-white flex items-center justify-center">
        <Card className="p-8 text-center card-warm max-w-md">
          <span className="text-6xl mb-4 block">😕</span>
          <h2 className="text-2xl font-serif font-bold text-italian-green-800 mb-4">Piatto Non Trovato</h2>
          <p className="text-italian-green-700 mb-6">This delicious dish seems to have wandered off from our menu.</p>
          <Button onClick={() => navigate('/')} className="btn-gradient text-white">
            Return to Menu
          </Button>
        </Card>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast({
        title: "Benvenuto! Please login",
        description: "Join our famiglia to add delicious items to your cart",
        variant: "destructive"
      });
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
          className="mb-6 flex items-center space-x-2 text-italian-green-700 hover:text-italian-green-800 hover:bg-italian-cream-100"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Torna al Menu</span>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Food Image */}
          <div className="animate-fade-in">
            <div className="relative rounded-2xl overflow-hidden shadow-xl">
              <img
                src={food.image}
                alt={food.name}
                className="w-full h-96 lg:h-[500px] object-cover"
                onError={(e) => {
                  e.currentTarget.src = `https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=600&h=500&fit=crop`;
                }}
              />
              <div className="absolute top-4 left-4">
                <Badge className="bg-white/95 text-italian-green-700 font-medium border border-italian-cream-200">
                  {food.category}
                </Badge>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
            </div>
          </div>

          {/* Food Details */}
          <div className="animate-scale-in">
            <Card className="p-8 shadow-xl border-0 card-warm h-fit">
              <CardContent className="p-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🇮🇹</span>
                  <span className="text-sm text-italian-green-600 font-medium">Ricetta Autentica</span>
                </div>
                
                <h1 className="text-3xl lg:text-4xl font-serif font-bold text-italian-green-800 mb-4">
                  {food.name}
                </h1>
                
                <div className="flex items-center mb-6">
                  <span className="text-3xl font-bold text-italian-green-700">
                    €{food.cost.toFixed(2)}
                  </span>
                  <span className="ml-2 text-sm text-italian-green-600">per porzione</span>
                </div>

                <p className="text-italian-green-700 text-lg mb-8 leading-relaxed font-light">
                  {food.description}
                </p>

                {/* Quantity Selector */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-italian-green-800 mb-3">
                    Quantità
                  </label>
                  <div className="flex items-center space-x-4">
                    <Button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      variant="outline"
                      size="sm"
                      className="w-10 h-10 rounded-full border-italian-green-300 hover:bg-italian-green-50"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-xl font-medium w-8 text-center text-italian-green-800">
                      {quantity}
                    </span>
                    <Button
                      onClick={() => setQuantity(quantity + 1)}
                      variant="outline"
                      size="sm"
                      className="w-10 h-10 rounded-full border-italian-green-300 hover:bg-italian-green-50"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Total Price */}
                <div className="mb-8 p-4 bg-italian-cream-100 rounded-lg border border-italian-cream-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-italian-green-800">Totale:</span>
                    <span className="text-2xl font-bold text-italian-green-700">
                      €{(food.cost * quantity).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <Button
                  onClick={handleAddToCart}
                  className="w-full btn-gradient text-white py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Aggiungi al Carrello
                </Button>

                {!isAuthenticated && (
                  <p className="text-sm text-italian-green-600 text-center mt-4">
                    Please <span className="text-italian-green-700 font-medium">login</span> to join our famiglia and order
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodDetail;
