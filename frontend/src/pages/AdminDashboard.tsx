import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService, Food, Order, User } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Plus, 
  Edit, 
  Trash2, 
  ShoppingCart, 
  Users, 
  DollarSign,
  Package,
  Truck,
  MapPin,
  Clock,
  User as UserIcon,
  Phone
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartStyle } from '@/components/ui/chart';
import { LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [foods, setFoods] = useState<Food[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryMen, setDeliveryMen] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: '',
    available: true
  });
  const [orderUpdateData, setOrderUpdateData] = useState({
    status: '',
    deliveryManId: '',
    estimatedDeliveryTime: ''
  });
  const [selectedDeliveryManId, setSelectedDeliveryManId] = React.useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [userTab, setUserTab] = useState<'all' | 'delivery'>('all');

  useEffect(() => {
    if (user?.role !== 'admin') return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const [foodsResponse, ordersResponse, deliveryMenResponse] = await Promise.all([
          apiService.getAllFoods(),
          apiService.getAllOrders(),
          apiService.getAvailableDeliveryMen()
        ]);
        
        if (foodsResponse.foods) setFoods(foodsResponse.foods);
        else if (foodsResponse.data) setFoods(foodsResponse.data);
        
        if (ordersResponse.orders) setOrders(ordersResponse.orders);
        else if (ordersResponse.data) setOrders(ordersResponse.data);

        if (deliveryMenResponse.deliveryMen) setDeliveryMen(deliveryMenResponse.deliveryMen);
        else if (deliveryMenResponse.data) setDeliveryMen(deliveryMenResponse.data);
      } catch (error: any) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load admin data. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, toast]);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    apiService.getAllUsers().then(res => {
      if (res.users) setAllUsers(res.users);
      else if (res.data) setAllUsers(res.data);
    });
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddFood = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const foodData = {
        ...formData,
        price: parseFloat(formData.price)
      };
      
      await apiService.addFood(foodData);
      
      // Refresh foods list
      const response = await apiService.getAllFoods();
      if (response.foods) setFoods(response.foods);
      else if (response.data) setFoods(response.data);
      
      setIsAddDialogOpen(false);
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        image: '',
        available: true
      });
      
      toast({
        title: "Success",
        description: "Food item added successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add food item.",
        variant: "destructive"
      });
    }
  };

  const handleEditFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFood) return;
    
    try {
      const foodData = {
        ...formData,
        price: parseFloat(formData.price)
      };
      
      await apiService.updateFood(editingFood._id, foodData);
      
      // Refresh foods list
      const response = await apiService.getAllFoods();
      if (response.foods) setFoods(response.foods);
      else if (response.data) setFoods(response.data);
      
      setIsEditDialogOpen(false);
      setEditingFood(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        image: '',
        available: true
      });
      
      toast({
        title: "Success",
        description: "Food item updated successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update food item.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteFood = async (foodId: string) => {
    if (!confirm('Are you sure you want to delete this food item?')) return;
    
    try {
      await apiService.deleteFood(foodId);
      
      // Refresh foods list
      const response = await apiService.getAllFoods();
      if (response.foods) setFoods(response.foods);
      else if (response.data) setFoods(response.data);
      
      toast({
        title: "Success",
        description: "Food item deleted successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete food item.",
        variant: "destructive"
      });
    }
  };

  const handleOrderStatusUpdate = async () => {
    if (!selectedOrder) return;
    
    try {
      const updateData: any = { status: orderUpdateData.status };
      
      if (orderUpdateData.deliveryManId && orderUpdateData.status === 'out_for_delivery') {
        updateData.deliveryManId = orderUpdateData.deliveryManId;
        if (orderUpdateData.estimatedDeliveryTime) {
          updateData.estimatedDeliveryTime = new Date(orderUpdateData.estimatedDeliveryTime);
        }
      }

      console.log('Updating order with data:', updateData); // Debug log
      await apiService.updateOrderStatus(selectedOrder._id, updateData);
      
      // Refresh orders list
      const response = await apiService.getAllOrders();
      if (response.orders) setOrders(response.orders);
      else if (response.data) setOrders(response.data);
      
      setIsOrderDialogOpen(false);
      setSelectedOrder(null);
      setOrderUpdateData({
        status: '',
        deliveryManId: '',
        estimatedDeliveryTime: ''
      });
      
      toast({
        title: "Success",
        description: "Order status updated successfully!",
      });
    } catch (error: any) {
      console.error('Order status update error:', error); // Debug log
      toast({
        title: "Error",
        description: error.message || "Failed to update order status.",
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
      image: food.image,
      available: food.available
    });
    setIsEditDialogOpen(true);
  };

  const openOrderDialog = (order: Order) => {
    setSelectedOrder(order);
    setOrderUpdateData({
      status: order.status,
      deliveryManId: order.deliveryMan?._id || '',
      estimatedDeliveryTime: ''
    });
    setIsOrderDialogOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    await apiService.deleteUser(userId);
    setAllUsers(users => users.filter(u => u._id !== userId));
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </Card>
      </div>
    );
  }

  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const pendingOrders = orders.filter(order => order.status === 'pending').length;
  const readyOrders = orders.filter(order => order.status === 'ready').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'out_for_delivery': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter delivered orders with feedback
  const feedbackOrders = orders.filter(order => order.status === 'delivered' && (order.foodRating || order.deliveryRating || order.feedbackComment));

  // Prepare chart data: group by month, average ratings
  const feedbackByMonth: { [month: string]: { foodRatings: number[]; deliveryRatings: number[] } } = {};
  feedbackOrders.forEach(order => {
    const month = new Date(order.createdAt).toLocaleString('default', { year: 'numeric', month: 'short' });
    if (!feedbackByMonth[month]) feedbackByMonth[month] = { foodRatings: [], deliveryRatings: [] };
    if (order.foodRating) feedbackByMonth[month].foodRatings.push(order.foodRating);
    if (order.deliveryRating) feedbackByMonth[month].deliveryRatings.push(order.deliveryRating);
  });
  const chartData = Object.entries(feedbackByMonth).map(([month, ratings]) => ({
    month,
    avgFood: ratings.foodRatings.length ? (ratings.foodRatings.reduce((a, b) => a + b, 0) / ratings.foodRatings.length) : null,
    avgDelivery: ratings.deliveryRatings.length ? (ratings.deliveryRatings.reduce((a, b) => a + b, 0) / ratings.deliveryRatings.length) : null,
  }));

  // --- REVENUE PER MONTH ---
  const revenueByMonth: { [month: string]: number } = {};
  orders.forEach(order => {
    if (order.status === 'delivered') {
      const month = new Date(order.createdAt).toLocaleString('default', { year: 'numeric', month: 'short' });
      if (!revenueByMonth[month]) revenueByMonth[month] = 0;
      revenueByMonth[month] += order.totalAmount;
    }
  });
  const revenueChartData = Object.entries(revenueByMonth).map(([month, revenue]) => ({ month, revenue }));

  // PDF download for revenue history
  const downloadRevenuePDF = () => {
    const doc = new jsPDF();
    doc.text('Revenue History Per Month', 14, 16);
    const rows = Object.entries(revenueByMonth).map(([month, revenue]) => [month, `€${revenue.toFixed(2)}`]);
    doc.autoTable({ head: [['Month', 'Revenue']], body: rows, startY: 24 });
    doc.save('revenue-history.pdf');
  };

  // --- DELIVERY MEN HISTORY & FEEDBACK ---
  const deliveryMenWithOrders = deliveryMen.map(dm => ({
    ...dm,
    deliveredOrders: orders.filter(order => order.deliveryMan?._id === dm._id && order.status === 'delivered'),
  }));
  const selectedDeliveryMan = deliveryMenWithOrders.find(dm => dm._id === selectedDeliveryManId);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your restaurant's food items and orders</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-primary text-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Total Orders</p>
                  <p className="text-2xl font-bold">{orders.length}</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-white/80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-secondary text-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Total Revenue</p>
                  <p className="text-2xl font-bold">€{totalRevenue.toFixed(2)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-white/80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-yellow-500 text-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Pending Orders</p>
                  <p className="text-2xl font-bold">{pendingOrders}</p>
                </div>
                <Package className="h-8 w-8 text-white/80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-500 text-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Ready for Delivery</p>
                  <p className="text-2xl font-bold">{readyOrders}</p>
                </div>
                <Truck className="h-8 w-8 text-white/80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Management Section */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-2xl font-semibold text-italian-green-700">User Management</h2>
            <div className="ml-auto flex gap-2">
              <Button variant={userTab === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setUserTab('all')}>All Users</Button>
              <Button variant={userTab === 'delivery' ? 'default' : 'outline'} size="sm" onClick={() => setUserTab('delivery')}>Delivery Men</Button>
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg shadow bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {(userTab === 'all' ? allUsers : allUsers.filter(u => u.role === 'delivery')).map(u => (
                  <tr key={u._id}>
                    <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-800">{u.name}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-gray-600">{u.email}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${u.role === 'admin' ? 'bg-blue-100 text-blue-700' : u.role === 'delivery' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{u.role}</span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-gray-600">{u.phone || '-'}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-right">
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(u._id)}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Food Management */}
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Food Management</CardTitle>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="btn-gradient text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Food
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Food Item</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddFood} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price">Price (€)</Label>
                        <Input
                          id="price"
                          name="price"
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                          value={formData.category}
                          onValueChange={value => setFormData(prev => ({ ...prev, category: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pizza">Pizza</SelectItem>
                            <SelectItem value="Pasta">Pasta</SelectItem>
                            <SelectItem value="Appetizer">Appetizer</SelectItem>
                            <SelectItem value="Dessert">Dessert</SelectItem>
                            <SelectItem value="Main Course">Main Course</SelectItem>
                            <SelectItem value="Salad">Salad</SelectItem>
                            <SelectItem value="Side">Side</SelectItem>
                            <SelectItem value="Drink">Drink</SelectItem>
                            <SelectItem value="Juice">Juice</SelectItem>
                            <SelectItem value="Soda">Soda</SelectItem>
                            <SelectItem value="Water">Water</SelectItem>
                            <SelectItem value="Coffee">Coffee</SelectItem>
                            <SelectItem value="Tea">Tea</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="image">Image URL</Label>
                      <Input
                        id="image"
                        name="image"
                        value={formData.image}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full btn-gradient text-white">
                      Add Food Item
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-food-orange-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading food items...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {foods.map((food) => (
                    <div key={food._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <img
                          src={food.image}
                          alt={food.name}
                          className="w-12 h-12 object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.src = `https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=48&h=48&fit=crop`;
                          }}
                        />
                        <div>
                          <h4 className="font-medium text-gray-900">{food.name}</h4>
                          <p className="text-sm text-gray-600">{food.category}</p>
                          <p className="text-sm font-medium text-food-orange-600">€{food.price.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => openEditDialog(food)}
                          variant="outline"
                          size="sm"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteFood(food._id)}
                          variant="outline"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Management */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Order Management</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-food-orange-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading orders...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.slice(0, 10).map((order) => (
                    <div key={order._id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                            <span>Order #{order._id.slice(-6)}</span>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status.replace('_', ' ')}
                            </Badge>
                          </h4>
                          <p className="text-sm text-gray-600">
                            {new Date(order.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-food-orange-600">€{order.totalAmount.toFixed(2)}</p>
                          <Button
                            onClick={() => openOrderDialog(order)}
                            variant="outline"
                            size="sm"
                            className="mt-2"
                          >
                            Manage
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">
                        <MapPin className="h-3 w-3 inline mr-1" />
                        {order.deliveryAddress}
                      </p>
                      <div className="mt-2 text-sm text-gray-500">
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''} • 
                        Total: {order.items.reduce((sum, item) => sum + item.quantity, 0)} qty
                      </div>
                      {order.deliveryMan && (
                        <div className="mt-2 text-sm text-blue-600">
                          <Truck className="h-3 w-3 inline mr-1" />
                          Assigned to: {order.deliveryMan.name}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Edit Food Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Food Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditFood} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Price (€)</Label>
                  <Input
                    id="edit-price"
                    name="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Input
                    id="edit-category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-image">Image URL</Label>
                <Input
                  id="edit-image"
                  name="image"
                  value={formData.image}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <Button type="submit" className="w-full btn-gradient text-white">
                Update Food Item
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Order Management Dialog */}
        <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Manage Order</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Order #{selectedOrder._id.slice(-6)}</h4>
                  <div className="text-sm text-gray-600">
                    Current Status: <Badge className={getStatusColor(selectedOrder.status)}>
                      {selectedOrder.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Update Status</Label>
                  <Select
                    value={orderUpdateData.status}
                    onValueChange={(value) => setOrderUpdateData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="preparing">Preparing</SelectItem>
                      <SelectItem value="ready">Ready</SelectItem>
                      <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {orderUpdateData.status === 'out_for_delivery' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="deliveryMan">Assign Delivery Man</Label>
                      <Select
                        value={orderUpdateData.deliveryManId}
                        onValueChange={(value) => setOrderUpdateData(prev => ({ ...prev, deliveryManId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select delivery man" />
                        </SelectTrigger>
                        <SelectContent>
                          {deliveryMen.map((deliveryMan) => (
                            <SelectItem key={deliveryMan._id} value={deliveryMan._id}>
                              {deliveryMan.name} {deliveryMan.phone && `(${deliveryMan.phone})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="estimatedTime">Estimated Delivery Time</Label>
                      <Input
                        id="estimatedTime"
                        type="datetime-local"
                        value={orderUpdateData.estimatedDeliveryTime}
                        onChange={(e) => setOrderUpdateData(prev => ({ 
                          ...prev, 
                          estimatedDeliveryTime: e.target.value 
                        }))}
                      />
                    </div>
                  </>
                )}

                <div className="flex space-x-2 pt-4">
                  <Button
                    onClick={handleOrderStatusUpdate}
                    className="flex-1 btn-gradient text-white"
                  >
                    Update Order
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsOrderDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminDashboard;
