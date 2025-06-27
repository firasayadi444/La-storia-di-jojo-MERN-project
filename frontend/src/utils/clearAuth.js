// Utility function to clear authentication data
export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  console.log('Authentication data cleared from localStorage');
};

// Function to check if user needs to re-authenticate
export const checkAuthValidity = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  if (!token || !user) {
    return false;
  }
  
  try {
    const userData = JSON.parse(user);
    return !!(userData && userData._id);
  } catch (error) {
    console.error('Error parsing stored user data:', error);
    return false;
  }
}; 