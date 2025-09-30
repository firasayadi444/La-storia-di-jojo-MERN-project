import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Food } from '../services/api';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { useToast } from '../hooks/use-toast';

interface FoodCardProps {
  food: Food;
}

const FoodCard: React.FC<FoodCardProps> = ({ food }) => {
  const { addToCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    addToCart(food);
    toast({
      title: "Aggiunto al carrello!",
      description: `${food.name} has been added to your cart`,
    });
  };

  return (
    <Card className="group cursor-pointer glass-card-food border-0 shadow-lg overflow-hidden hover:shadow-2xl hover:ring-2 hover:ring-italian-green-200 transition-all duration-500 card-parallax">
      <div className="relative overflow-hidden">
        <img
          src={food.image}
          alt={food.name}
          className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          onError={(e) => {
            console.log('Image failed to load:', food.image);
            e.currentTarget.src = `https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop`;
          }}
        />
        
        {/* Overlay gradient amélioré */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        {/* Badge de catégorie amélioré */}
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1.5 bg-white/95 backdrop-blur-md text-xs font-semibold text-italian-green-700 rounded-full border border-white/30 shadow-lg">
            {food.category}
          </span>
        </div>
        
        {/* Prix avec effet glassmorphism */}
        <div className="absolute top-4 right-4">
          <div className="px-4 py-2 bg-gradient-to-r from-italian-green-600 to-italian-green-700 text-white text-sm font-bold rounded-full shadow-xl backdrop-blur-sm border border-white/20">
            €{food.price.toFixed(2)}
          </div>
        </div>
        
        {/* Bouton d'action flottant */}
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
          <Button
            onClick={handleAddToCart}
            size="sm"
            className="btn-gradient text-white rounded-full px-4 py-2 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
        
        {/* Effet de brillance au survol */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
      </div>
      
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-serif font-bold text-xl text-gray-900 group-hover:text-italian-green-700 transition-colors leading-tight">
            {food.name}
          </h3>
        </div>
        
        <p className="text-gray-600 text-sm mb-6 line-clamp-3 leading-relaxed group-hover:text-gray-700 transition-colors">
          {food.description}
        </p>
        
        {/* Rating et popularité */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="text-yellow-400 text-sm">★</span>
            ))}
          </div>
          <span className="text-xs text-gray-500">(4.8)</span>
          <span className="text-xs text-italian-green-600 font-medium">Popular</span>
        </div>
        
        <div className="flex justify-between items-center">
          <Link 
            to={`/food/${food._id}`}
            className="text-italian-green-700 hover:text-italian-green-800 text-sm font-semibold transition-all duration-300 hover:underline decoration-2 underline-offset-2 flex items-center gap-1 group/link"
          >
            <span>View Recipe</span>
            <span className="group-hover/link:translate-x-1 transition-transform duration-300">→</span>
          </Link>
          
          <div className="hidden group-hover:block">
            <Button
              onClick={handleAddToCart}
              size="sm"
              className="btn-gradient text-white flex items-center space-x-2 rounded-full px-5 py-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <Plus className="h-4 w-4" />
              <span>Add to Cart</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FoodCard;
