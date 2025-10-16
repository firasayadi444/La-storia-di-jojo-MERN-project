/**
 * Utility functions for cart management
 */

export const forceClearCart = () => {
  console.log('🧹 Force clearing cart...');
  
  // Clear from localStorage
  localStorage.removeItem('cart');
  localStorage.removeItem('checkoutFormData');
  localStorage.removeItem('pendingOrderData');
  localStorage.removeItem('pendingOrderId');
  
  // Clear from sessionStorage as well (if used)
  sessionStorage.removeItem('cart');
  sessionStorage.removeItem('checkoutFormData');
  sessionStorage.removeItem('pendingOrderData');
  sessionStorage.removeItem('pendingOrderId');
  
  console.log('🧹 Cart force cleared successfully');
};

export const checkCartStatus = () => {
  const cartInLocalStorage = localStorage.getItem('cart');
  const cartInSessionStorage = sessionStorage.getItem('cart');
  
  console.log('🔍 Cart Status Check:');
  console.log('  - localStorage cart:', cartInLocalStorage);
  console.log('  - sessionStorage cart:', cartInSessionStorage);
  
  return {
    hasLocalStorageCart: !!cartInLocalStorage,
    hasSessionStorageCart: !!cartInSessionStorage,
    localCartData: cartInLocalStorage ? JSON.parse(cartInLocalStorage) : null,
    sessionCartData: cartInSessionStorage ? JSON.parse(cartInSessionStorage) : null
  };
};

export const validateCartData = (cartData: any) => {
  if (!cartData) return false;
  
  try {
    if (Array.isArray(cartData)) {
      return cartData.every(item => 
        item && 
        item.food && 
        item.food._id && 
        typeof item.quantity === 'number' && 
        item.quantity > 0
      );
    }
    return false;
  } catch (error) {
    console.error('Error validating cart data:', error);
    return false;
  }
};







