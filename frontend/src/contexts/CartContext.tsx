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
        const parsedCart = JSON.parse(savedCart);
        console.log('🛒 Loading cart from localStorage:', parsedCart);
        setItems(parsedCart);
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        localStorage.removeItem('cart');
      }
    } else {
      console.log('🛒 No saved cart found in localStorage');
    }
  }, []);

  // Restore cart when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && user?.role === 'user' && items.length === 0) {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          setItems(parsedCart);
        } catch (error) {
          console.error('Error restoring cart from localStorage:', error);
          localStorage.removeItem('cart');
        }
      }
    }
  }, [isAuthenticated, user?.role, items.length]);

  // Clear cart only when user is explicitly not authenticated or not a regular user
  // Don't clear on initial load when authentication is still being checked
  useEffect(() => {
    // Only clear cart if we're sure the user is not authenticated or not a regular user
    // and we're not in the initial loading state
    if (isAuthenticated === false && user === null) {
      setItems([]);
      localStorage.removeItem('cart');
    } else if (isAuthenticated === true && user?.role && user.role !== 'user') {
      setItems([]);
      localStorage.removeItem('cart');
    }
  }, [isAuthenticated, user?.role]);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    // Always save cart to localStorage, regardless of authentication status
    // This ensures cart persists through page refreshes
    if (items.length > 0) {
      console.log('🛒 Saving cart to localStorage:', items);
      localStorage.setItem('cart', JSON.stringify(items));
    } else if (items.length === 0) {
      // Clear localStorage when cart is empty
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        console.log('🛒 Clearing cart from localStorage (empty cart)');
        localStorage.removeItem('cart');
      }
    }
  }, [items]);

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
    console.log('🛒 Clearing cart...');
    setItems([]);
    localStorage.removeItem('cart');
    console.log('🛒 Cart cleared successfully');
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