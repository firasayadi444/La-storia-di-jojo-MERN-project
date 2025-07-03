// Utility function to clear authentication data
export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  console.log('Authentication data cleared from localStorage and sessionStorage');
};

// Function to check if user needs to re-authenticate
export const checkAuthValidity = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const user = localStorage.getItem('user') || sessionStorage.getItem('user');
  
  if (!token || !user) {
    return false;
  }
  
  try {
    // Check if token is expired
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    if (payload.exp < currentTime) {
      console.log('Token expired, clearing auth data');
      clearAuthData();
      return false;
    }
    
    const userData = JSON.parse(user);
    return !!(userData && userData._id);
  } catch (error) {
    console.error('Error checking auth validity:', error);
    clearAuthData();
    return false;
  }
}; 