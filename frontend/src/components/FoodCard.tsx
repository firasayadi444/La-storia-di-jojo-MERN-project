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
      toast({
        title: "Benvenuto! Please login",
        description: "Join our famiglia to add delicious items to your cart",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }

    if (user?.role !== 'user') {
      toast({
        title: "Access Restricted",
        description: "Only customers can add items to cart and place orders",
        variant: "destructive"
      });
      return;
    }
    
    addToCart(food);
    toast({
      title: "Aggiunto al carrello!",
      description: `${food.name} has been added to your cart`,
    });
  };

  return (
    <Card className="group cursor-pointer card-hover card-warm border-0 shadow-md overflow-hidden">
      <div className="relative overflow-hidden">
        <img
          src={food.image}
          alt={food.name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            console.log('Image failed to load:', food.image);
            e.currentTarget.src = `https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop`;
          }}
        />
        <div className="absolute top-3 left-3">
          <span className="px-3 py-1 bg-white/95 backdrop-blur-sm text-xs font-medium text-italian-green-700 rounded-full border border-italian-cream-200">
            {food.category}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="px-3 py-1 bg-italian-green-700 text-white text-sm font-bold rounded-full shadow-md">
            €{food.price.toFixed(2)}
          </span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
      
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-serif font-semibold text-lg text-gray-900 group-hover:text-italian-green-700 transition-colors leading-tight">
            {food.name}
          </h3>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">{food.description}</p>
        
        <div className="flex justify-between items-center">
          <Link 
            to={`/food/${food._id}`}
            className="text-italian-green-700 hover:text-italian-green-800 text-sm font-medium transition-colors hover:underline decoration-2 underline-offset-2"
          >
            View Recipe
          </Link>
          
          {user?.role === 'user' ? (
            <Button
              onClick={handleAddToCart}
              size="sm"
              className="btn-gradient text-white flex items-center space-x-2 rounded-full px-4 shadow-md hover:shadow-lg"
            >
              <Plus className="h-4 w-4" />
              <span>Add</span>
            </Button>
          ) : (
            <div className="text-xs text-italian-green-600 px-3 py-1 bg-italian-cream-100 rounded-full">
              {user?.role === 'admin' ? 'Admin' : 'Delivery'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FoodCard;
