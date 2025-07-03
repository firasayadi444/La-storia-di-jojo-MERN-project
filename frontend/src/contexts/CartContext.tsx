import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Food } from '../services/api';
import { useAuth } from './AuthContext';

interface CartItem {
  food: Food;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (food: Food, quantity?: number) => void;
  removeFromCart: (foodId: string) => void;
  updateQuantity: (foodId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const { isAuthenticated, user } = useAuth();

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        localStorage.removeItem('cart');
      }
    }
  }, []);

  // Clear cart when user is not authenticated or not a regular user
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'user') {
      setItems([]);
      localStorage.removeItem('cart');
    }
  }, [isAuthenticated, user?.role]);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    if (isAuthenticated && user?.role === 'user') {
      localStorage.setItem('cart', JSON.stringify(items));
    }
  }, [items, isAuthenticated, user?.role]);

  const addToCart = (food: Food, quantity: number = 1) => {
    // Only allow adding to cart if user is authenticated and is a regular user
    if (!isAuthenticated || user?.role !== 'user') {
      return;
    }

    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.food._id === food._id);
      
      if (existingItem) {
        return prevItems.map(item =>
          item.food._id === food._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prevItems, { food, quantity }];
      }
    });
  };

  const removeFromCart = (foodId: string) => {
    setItems(prevItems => prevItems.filter(item => item.food._id !== foodId));
  };

  const updateQuantity = (foodId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(foodId);
      return;
    }

    setItems(prevItems =>
      prevItems.map(item =>
        item.food._id === foodId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + (item.food.price * item.quantity), 0);
  };

  const value: CartContextType = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}; 