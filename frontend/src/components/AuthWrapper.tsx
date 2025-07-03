import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

interface AuthWrapperProps {
  children: React.ReactNode;
}

const AuthWrapper = ({ children }: AuthWrapperProps) => {
  const { logout } = useAuth();

  useEffect(() => {
    // Set up global error handler for 401 responses
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      
      if (response.status === 401) {
        console.log('Unauthorized request detected, logging out user');
        logout();
        return response;
      }
      
      return response;
    };

    // Cleanup function
    return () => {
      window.fetch = originalFetch;
    };
  }, [logout]);

  return <>{children}</>;
};

export default AuthWrapper; 