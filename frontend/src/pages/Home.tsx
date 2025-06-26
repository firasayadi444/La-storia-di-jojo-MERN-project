import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { apiService, Food } from '../services/api';
import FoodCard from '../components/FoodCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const Home: React.FC = () => {
  const { selectedCategory, setSelectedCategory, categories } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch foods from API
  useEffect(() => {
    const fetchFoods = async () => {
      try {
        setLoading(true);
        const response = await apiService.getAllFoods();
        // Use the correct response structure from backend
        if (response.foods) {
          setFoods(response.foods);
        } else if (response.data) {
          setFoods(response.data);
        }
      } catch (error: any) {
        console.error('Error fetching foods:', error);
        toast({
          title: "Error",
          description: "Failed to load food items. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFoods();
  }, [toast]);

  const filteredFoods = foods.filter(food => {
    const matchesCategory = selectedCategory === 'All' || food.category === selectedCategory;
    const matchesSearch = food.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         food.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-italian-cream-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-italian-green-600 mx-auto mb-4"></div>
          <p className="text-italian-green-700">Loading delicious food...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-italian-cream-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-hero text-white py-20 italian-pattern relative overflow-hidden">
        <div className="absolute inset-0 bg-italian-green-700/90"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-bounce-gentle mb-6">
            <span className="text-6xl">🍝</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6 animate-fade-in">
            Benvenuti alla
            <span className="block text-italian-cream-200">LaStoria Di JoJo</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90 animate-fade-in font-light">
            Authentic Italian recipes passed down through generations
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative animate-scale-in">
            <Input
              type="text"
              placeholder="Cerca la tua pasta preferita..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 text-lg rounded-full border-0 bg-white/95 backdrop-blur-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-italian-cream-400 focus:outline-none shadow-lg"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap gap-3 justify-center md:justify-start">
          {categories.map((category) => (
            <Button
              key={category}
              onClick={() => setSelectedCategory(category)}
              variant={selectedCategory === category ? 'default' : 'outline'}
              className={`rounded-full px-6 py-2 transition-all duration-300 font-medium ${
                selectedCategory === category
                  ? 'btn-gradient text-white shadow-lg'
                  : 'bg-white hover:bg-italian-cream-50 hover:text-italian-green-700 hover:border-italian-green-300 border-italian-cream-300'
              }`}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Food Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {filteredFoods.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredFoods.map((food, index) => (
              <div key={food._id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <FoodCard food={food} />
              </div>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center card-warm">
            <div className="text-gray-600">
              <span className="text-4xl mb-4 block">🔍</span>
              <h3 className="text-lg font-medium mb-2">Nessun piatto trovato</h3>
              <p>Try adjusting your search or category filter</p>
            </div>
          </Card>
        )}
      </div>

      {/* Features Section */}
      <div className="bg-gradient-warm py-16 border-t border-italian-cream-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold text-italian-green-800 mb-4">Perché Scegliere LaStoria Di JoJo?</h2>
            <p className="text-lg text-italian-green-700">Traditional recipes, modern convenience, famiglia values</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-white text-2xl">🚀</span>
              </div>
              <h3 className="text-xl font-serif font-semibold mb-2 text-italian-green-800">Consegna Veloce</h3>
              <p className="text-italian-green-700">Fresh from our kitchen to your table in 30 minutes</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-secondary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-italian-green-800 text-2xl">👵</span>
              </div>
              <h3 className="text-xl font-serif font-semibold mb-2 text-italian-green-800">Ricette Tradizionali</h3>
              <p className="text-italian-green-700">Authentic recipes passed down from JoJo himself</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-white text-2xl">❤️</span>
              </div>
              <h3 className="text-xl font-serif font-semibold mb-2 text-italian-green-800">Made with Amore</h3>
              <p className="text-italian-green-700">Every dish prepared with love and finest ingredients</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
