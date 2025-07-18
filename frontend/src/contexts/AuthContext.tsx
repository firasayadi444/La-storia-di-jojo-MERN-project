import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService, User } from '../services/api';
import { clearAuthData, checkAuthValidity } from '../utils/clearAuth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, cf_password: string, address?: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => void;
  updateUserAvailability: (isAvailable: boolean) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth data on app load
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      // Validate the stored auth data
      if (checkAuthValidity()) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } else {
        // Clear invalid auth data
        clearAuthData();
        console.log('Invalid auth data detected and cleared');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await apiService.login({ email, password });
      
      if (response.user && response.token) {
        setUser(response.user);
        setToken(response.token);
        
        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem('token', response.token);
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, cf_password: string, address?: string): Promise<boolean> => {
    try {
      setLoading(true);
      await apiService.register({ name, email, password, cf_password, address });
      
      // After successful registration, automatically log in
      return await login(email, password);
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    clearAuthData();
    // Also clear cart when user logs out
    localStorage.removeItem('cart');
  };

  const refreshUser = () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  };

  const updateUserAvailability = (isAvailable: boolean) => {
    if (user) {
      const updatedUser = { ...user, isAvailable };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    refreshUser,
    updateUserAvailability,
    isAuthenticated: !!user && !!token,
    isAdmin: user?.role === 'admin',
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
