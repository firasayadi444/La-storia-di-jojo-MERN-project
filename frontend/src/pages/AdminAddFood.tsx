import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Upload, 
  ArrowLeft, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Filter,
  Grid,
  List,
  MoreHorizontal,
  Star,
  Clock,
  DollarSign,
  Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiService, Food } from '@/services/api';

const AdminFoodManagement: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [foods, setFoods] = useState<Food[]>([]);
  const [filteredFoods, setFilteredFoods] = useState<Food[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: null as File | null
  });

  const categories = [
    'Pizza',
    'Pasta',
    'Salads',
    'Appetizers',
    'Desserts',
    'Beverages',
    'Main Courses',
    'Soups',
    'Sandwiches',
    'Specialties'
  ];

  // Fetch foods on component mount
  useEffect(() => {
    fetchFoods();
  }, []);

  // Filter foods based on search and category
  useEffect(() => {
    let filtered = foods;
    
    if (searchTerm) {
      filtered = filtered.filter(food => 
        food.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        food.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(food => food.category === selectedCategory);
    }
    
    setFilteredFoods(filtered);
  }, [foods, searchTerm, selectedCategory]);

  const fetchFoods = async () => {
    try {
      const response = await apiService.getAllFoods();
      setFoods(response.foods || response.data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch food items.",
        variant: "destructive"
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      category: value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      image: null
    });
    setImagePreview(null);
  };

  const handleAddFood = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || !formData.price || !formData.category || !formData.image) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields and select an image.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('image', formData.image);

      await apiService.addFood(formDataToSend);
      
      toast({
        title: "Success!",
        description: "Food item added successfully.",
      });
      
      resetForm();
      setIsAddDialogOpen(false);
      fetchFoods();
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add food item.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditFood = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingFood || !formData.name || !formData.description || !formData.price || !formData.category) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const updateData: Partial<Food> = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
      };

      await apiService.updateFood(editingFood._id, updateData);
      
      toast({
        title: "Success!",
        description: "Food item updated successfully.",
      });
      
      resetForm();
      setEditingFood(null);
      setIsEditDialogOpen(false);
      fetchFoods();
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update food item.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFood = async (foodId: string) => {
    if (!confirm('Are you sure you want to delete this food item?')) return;
    
    try {
      await apiService.deleteFood(foodId);
      toast({
        title: "Success!",
        description: "Food item deleted successfully.",
      });
      fetchFoods();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete food item.",
        variant: "destructive"
      });
    }
  };

  const handleToggleAvailability = async (food: Food) => {
    try {
      await apiService.updateFood(food._id, { available: !food.available });
      toast({
        title: "Success!",
        description: `Food item ${food.available ? 'unavailable' : 'available'} successfully.`,
      });
      fetchFoods();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update food availability.",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (food: Food) => {
    setEditingFood(food);
    setFormData({
      name: food.name,
      description: food.description,
      price: food.price.toString(),
      category: food.category,
      image: null
    });
    setIsEditDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-italian-cream-50 to-italian-cream-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 flex items-center space-x-2 text-italian-green-700 hover:text-italian-green-800"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-italian-green-800">Food Management</h1>
              <p className="text-italian-green-600 mt-1">Manage your restaurant's menu items</p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="btn-gradient text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Food
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <Plus className="h-5 w-5 text-italian-green-600" />
                    <span>Add New Food Item</span>
                  </DialogTitle>
                  <DialogDescription>
                    Fill in the details below to add a new food item to your menu
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleAddFood} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Food Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="e.g., Margherita Pizza"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select value={formData.category} onValueChange={handleCategoryChange} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (€) *</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="e.g., 12.99"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Describe the food item, ingredients, and special features..."
                      rows={3}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="image">Food Image *</Label>
                    <div className="flex items-center justify-center w-full">
                      <label
                        htmlFor="image"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <Upload className="w-8 h-8 mb-2 text-gray-500" />
                        <p className="text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <input
                          id="image"
                          name="image"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                          required
                        />
                      </label>
                    </div>
                    
                    {imagePreview && (
                      <div className="flex justify-center">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Adding...' : 'Add Food Item'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-1 gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search food items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Food Items Display */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Items ({filteredFoods.length})</TabsTrigger>
            <TabsTrigger value="available">Available ({filteredFoods.filter(f => f.available).length})</TabsTrigger>
            <TabsTrigger value="unavailable">Unavailable ({filteredFoods.filter(f => !f.available).length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-6">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredFoods.map((food) => (
                  <FoodCard
                    key={food._id}
                    food={food}
                    onEdit={() => openEditDialog(food)}
                    onDelete={() => handleDeleteFood(food._id)}
                    onToggleAvailability={() => handleToggleAvailability(food)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFoods.map((food) => (
                  <FoodListItem
                    key={food._id}
                    food={food}
                    onEdit={() => openEditDialog(food)}
                    onDelete={() => handleDeleteFood(food._id)}
                    onToggleAvailability={() => handleToggleAvailability(food)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="available" className="space-y-6">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredFoods.filter(f => f.available).map((food) => (
                  <FoodCard
                    key={food._id}
                    food={food}
                    onEdit={() => openEditDialog(food)}
                    onDelete={() => handleDeleteFood(food._id)}
                    onToggleAvailability={() => handleToggleAvailability(food)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFoods.filter(f => f.available).map((food) => (
                  <FoodListItem
                    key={food._id}
                    food={food}
                    onEdit={() => openEditDialog(food)}
                    onDelete={() => handleDeleteFood(food._id)}
                    onToggleAvailability={() => handleToggleAvailability(food)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="unavailable" className="space-y-6">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredFoods.filter(f => !f.available).map((food) => (
                  <FoodCard
                    key={food._id}
                    food={food}
                    onEdit={() => openEditDialog(food)}
                    onDelete={() => handleDeleteFood(food._id)}
                    onToggleAvailability={() => handleToggleAvailability(food)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFoods.filter(f => !f.available).map((food) => (
                  <FoodListItem
                    key={food._id}
                    food={food}
                    onEdit={() => openEditDialog(food)}
                    onDelete={() => handleDeleteFood(food._id)}
                    onToggleAvailability={() => handleToggleAvailability(food)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Food Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Edit className="h-5 w-5 text-italian-green-600" />
                <span>Edit Food Item</span>
              </DialogTitle>
              <DialogDescription>
                Update the details of this food item
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleEditFood} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Food Name *</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Margherita Pizza"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category *</Label>
                  <Select value={formData.category} onValueChange={handleCategoryChange} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-price">Price (€) *</Label>
                <Input
                  id="edit-price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="e.g., 12.99"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description *</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the food item, ingredients, and special features..."
                  rows={3}
                  required
                />
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Food Item'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

// Food Card Component
const FoodCard: React.FC<{
  food: Food;
  onEdit: () => void;
  onDelete: () => void;
  onToggleAvailability: () => void;
}> = ({ food, onEdit, onDelete, onToggleAvailability }) => {
  return (
    <Card className={`group hover:shadow-lg transition-all duration-300 ${!food.available ? 'opacity-60' : ''}`}>
      <div className="relative">
        <img
          src={food.image}
          alt={food.name}
          className="w-full h-48 object-cover rounded-t-lg"
        />
        <div className="absolute top-2 right-2 flex space-x-1">
          <Badge variant={food.available ? "default" : "secondary"}>
            {food.available ? 'Available' : 'Unavailable'}
          </Badge>
        </div>
        <div className="absolute top-2 left-2">
          <Badge variant="outline" className="bg-white/90">
            {food.category}
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">{food.name}</h3>
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="sm" variant="ghost" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={onToggleAvailability}>
              {food.available ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button size="sm" variant="ghost" onClick={onDelete} className="text-red-600 hover:text-red-700">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <p className="text-gray-600 text-sm line-clamp-2 mb-3">{food.description}</p>
        
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-italian-green-600">€{food.price.toFixed(2)}</span>
          <span className="text-xs text-gray-500">
            {new Date(food.createdAt).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

// Food List Item Component
const FoodListItem: React.FC<{
  food: Food;
  onEdit: () => void;
  onDelete: () => void;
  onToggleAvailability: () => void;
}> = ({ food, onEdit, onDelete, onToggleAvailability }) => {
  return (
    <Card className={`group hover:shadow-md transition-all duration-300 ${!food.available ? 'opacity-60' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <img
            src={food.image}
            alt={food.name}
            className="w-16 h-16 object-cover rounded-lg"
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-lg text-gray-900 truncate">{food.name}</h3>
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="sm" variant="ghost" onClick={onEdit}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={onToggleAvailability}>
                  {food.available ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="ghost" onClick={onDelete} className="text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <p className="text-gray-600 text-sm line-clamp-1 mb-2">{food.description}</p>
            
            <div className="flex items-center space-x-4">
              <Badge variant="outline">
                <Tag className="h-3 w-3 mr-1" />
                {food.category}
              </Badge>
              <Badge variant={food.available ? "default" : "secondary"}>
                {food.available ? 'Available' : 'Unavailable'}
              </Badge>
              <span className="text-lg font-bold text-italian-green-600">€{food.price.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminFoodManagement; 