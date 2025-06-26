
import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Food {
  id: string;
  name: string;
  category: string;
  cost: number;
  description: string;
  image: string;
}

export interface Order {
  id: string;
  name: string;
  email: string;
  foodName: string;
  address: string;
  status: 'pending' | 'preparing' | 'delivered';
  total: number;
  date: string;
}

interface CartItem extends Food {
  quantity: number;
}

interface AppContextType {
  foods: Food[];
  orders: Order[];
  cart: CartItem[];
  addToCart: (food: Food) => void;
  removeFromCart: (foodId: string) => void;
  updateCartQuantity: (foodId: string, quantity: number) => void;
  clearCart: () => void;
  placeOrder: (orderData: Omit<Order, 'id' | 'date'>) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  categories: string[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // Mock food data
  const [foods] = useState<Food[]>([
    {
      id: '1',
      name: 'Margherita Pizza',
      category: 'Pizza',
      cost: 12.99,
      description: 'Fresh tomato sauce, mozzarella, and basil on a crispy crust',
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b'
    },
    {
      id: '2',
      name: 'Classic Burger',
      category: 'Burgers',
      cost: 9.99,
      description: 'Juicy beef patty with lettuce, tomato, onion, and our special sauce',
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd'
    },
    {
      id: '3',
      name: 'Chicken Teriyaki',
      category: 'Asian',
      cost: 14.99,
      description: 'Grilled chicken glazed with teriyaki sauce, served with steamed rice',
      image: 'https://images.unsplash.com/photo-1607330289090-7e7c1e5b5b4b'
    },
    {
      id: '4',
      name: 'Caesar Salad',
      category: 'Salads',
      cost: 8.99,
      description: 'Fresh romaine lettuce, croutons, parmesan cheese, and caesar dressing',
      image: 'https://images.unsplash.com/photo-1551248429-40975aa4de74'
    },
    {
      id: '5',
      name: 'Spaghetti Carbonara',
      category: 'Pasta',
      cost: 13.99,
      description: 'Creamy pasta with pancetta, eggs, parmesan, and black pepper',
      image: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5'
    },
    {
      id: '6',
      name: 'Fish Tacos',
      category: 'Mexican',
      cost: 11.99,
      description: 'Grilled fish with cabbage slaw, salsa, and cilantro lime crema',
      image: 'https://images.unsplash.com/photo-1565299585323-38174c6339cd'
    }
  ]);

  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(foods.map(food => food.category)))];

  const addToCart = (food: Food) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.id === food.id);
      if (existingItem) {
        return prev.map(item =>
          item.id === food.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...food, quantity: 1 }];
    });
  };

  const removeFromCart = (foodId: string) => {
    setCart(prev => prev.filter(item => item.id !== foodId));
  };

  const updateCartQuantity = (foodId: string, quantity: number) => {
    if (quantity === 0) {
      removeFromCart(foodId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.id === foodId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const placeOrder = (orderData: Omit<Order, 'id' | 'date'>) => {
    const newOrder: Order = {
      ...orderData,
      id: Date.now().toString(),
      date: new Date().toISOString()
    };
    setOrders(prev => [...prev, newOrder]);
    clearCart();
  };

  const value: AppContextType = {
    foods,
    orders,
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    placeOrder,
    selectedCategory,
    setSelectedCategory,
    categories
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
