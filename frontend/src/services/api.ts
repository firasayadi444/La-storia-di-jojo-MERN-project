const API_BASE_URL = '/api';

// Types
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'delivery';
  address?: string;
  phone?: string;
  isAvailable?: boolean;
  currentLocation?: {
    type: string;
    coordinates: number[];
  };
  status?: 'pending' | 'active' | 'rejected';
  vehicleType?: string;
  vehiclePhoto?: string;
  facePhoto?: string;
  cinPhoto?: string;
  mustChangePassword?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Food {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  available: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  _id: string;
  userId: string;
  orderId: string;
  amount: number;
  paymentMethod: 'card' | 'cash';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  stripePaymentId?: string;
  stripeChargeId?: string;
  stripePaymentIntentId?: string;
  paidAt?: string;
  refundedAt?: string;
  refundId?: string;
  refundReason?: string;
  createdAt: string;
  updatedAt: string;
}


export interface Order {
  _id: string;
  user: User;
  items: Array<{
    food: Food;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  deliveryAddress: string;
  customerLocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp?: string;
  };
  deliveryMan?: User;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  deliveryNotes?: string;
  deliveryRating?: number;
  foodRating?: number;
  feedbackComment?: string;
  assignedAt?: string;
  payment?: Payment | string; // Can be populated or just reference
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  cf_password: string;
  address?: string;
}

export interface ApiResponse<T> {
  message: string;
  data?: T;
  user?: User;
  token?: string;
  foods?: Food[];
  food?: Food;
  orders?: Order[];
  order?: Order;
}

export interface Address {
  _id?: string;
  label: string;
  address: string;
  googleMapLink?: string;
  isDefault?: boolean;
}

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

// Helper function to validate token before making requests
const validateToken = (): boolean => {
  const token = getAuthToken();
  if (!token) {
    return false;
  }
  
  try {
    // Simple token validation without external dependency
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    if (payload.exp < currentTime) {
      // Clear expired token
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error validating token:', error);
    // Clear invalid token
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    return false;
  }
};

// Helper function to handle API responses
const handleResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  
  return data;
};

// API class
class ApiService {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  // Auth endpoints
  async login(credentials: LoginData): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await fetch(`${this.baseURL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    return handleResponse<{ user: User; token: string }>(response);
  }

  async register(userData: RegisterData): Promise<ApiResponse<void>> {
    const response = await fetch(`${this.baseURL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    return handleResponse<void>(response);
  }

  async changePassword(passwordData: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<ApiResponse<void>> {
    if (!validateToken()) throw new Error('Authentication required');
    const token = getAuthToken();

    const response = await fetch(`${this.baseURL}/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(passwordData),
    });
    return handleResponse<void>(response);
  }

  // Food endpoints
  async getAllFoods(): Promise<ApiResponse<Food[]>> {
    const response = await fetch(`${this.baseURL}/foods`);
    return handleResponse<Food[]>(response);
  }

  async getFoodDetails(id: string): Promise<ApiResponse<Food>> {
    const response = await fetch(`${this.baseURL}/food/${id}`);
    return handleResponse<Food>(response);
  }

  async addFood(foodData: FormData): Promise<ApiResponse<Food>> {
    if (!validateToken()) throw new Error('Authentication required');
    const token = getAuthToken();

    const response = await fetch(`${this.baseURL}/food/new`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type for FormData, let the browser set it with boundary
      },
      body: foodData,
    });
    return handleResponse<Food>(response);
  }

  async updateFood(id: string, foodData: Partial<Food>): Promise<ApiResponse<Food>> {
    if (!validateToken()) throw new Error('Authentication required');
    const token = getAuthToken();

    const response = await fetch(`${this.baseURL}/food/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(foodData),
    });
    return handleResponse<Food>(response);
  }

  async deleteFood(id: string): Promise<ApiResponse<void>> {
    if (!validateToken()) throw new Error('Authentication required');
    const token = getAuthToken();

    const response = await fetch(`${this.baseURL}/food/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse<void>(response);
  }

  // Order endpoints
  async makeOrder(orderData: {
    items: Array<{ food: string; quantity: number; price: number }>;
    totalAmount: number;
    deliveryAddress: string;
  }): Promise<ApiResponse<Order>> {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');

    const response = await fetch(`${this.baseURL}/order/new`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(orderData),
    });
    return handleResponse<Order>(response);
  }

  async getAllOrders(): Promise<ApiResponse<Order[]>> {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');

    const response = await fetch(`${this.baseURL}/orders`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse<Order[]>(response);
  }

  async getUserOrders(): Promise<ApiResponse<Order[]>> {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');

    const response = await fetch(`${this.baseURL}/orders/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse<Order[]>(response);
  }

  async getDeliveryOrders(): Promise<ApiResponse<Order[]>> {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');

    const response = await fetch(`${this.baseURL}/orders/delivery`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse<Order[]>(response);
  }

  async getOrderCustomerLocation(orderId: string): Promise<ApiResponse<{
    orderId: string;
    customerLocation: {
      latitude: number;
      longitude: number;
      accuracy?: number;
      timestamp?: string;
    };
    customer: {
      name: string;
      phone?: string;
      email: string;
    };
    deliveryAddress: string;
  }>> {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');

    const response = await fetch(`${this.baseURL}/orders/${orderId}/customer-location`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  }

  async getAvailableDeliveryMen(): Promise<ApiResponse<User[]>> {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');

    const response = await fetch(`${this.baseURL}/delivery-men`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse<User[]>(response);
  }

  async updateOrderStatus(orderId: string, updateData: {
    status: string;
    deliveryManId?: string;
    estimatedDeliveryTime?: Date;
    deliveryNotes?: string;
  }): Promise<ApiResponse<Order>> {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');

    const response = await fetch(`${this.baseURL}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });
    return handleResponse<Order>(response);
  }

  async deleteOrder(id: string): Promise<ApiResponse<void>> {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');

    const response = await fetch(`${this.baseURL}/orders/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse<void>(response);
  }

  async cancelOrder(id: string): Promise<ApiResponse<Order>> {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');

    const response = await fetch(`${this.baseURL}/orders/${id}/cancel`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse<Order>(response);
  }

  async submitFeedback(orderId: string, feedback: {
    deliveryRating: number;
    foodRating: number;
    feedbackComment?: string;
  }): Promise<ApiResponse<Order>> {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');
    const response = await fetch(`${this.baseURL}/orders/${orderId}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(feedback),
    });
    return handleResponse<Order>(response);
  }

  async getOrderDetails(orderId: string): Promise<ApiResponse<Order>> {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');
    const response = await fetch(`${this.baseURL}/orders/${orderId}/details`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse<Order>(response);
  }

  async getPendingDeliveryMen(): Promise<ApiResponse<User[]>> {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');
    const response = await fetch(`${this.baseURL}/deliveryman/pending`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse<User[]>(response);
  }

  async getAllDeliveryMen(): Promise<ApiResponse<User[]>> {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');
    const response = await fetch(`${this.baseURL}/deliveryman/all`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse<User[]>(response);
  }

  async updateDeliveryAvailability(isAvailable: boolean): Promise<ApiResponse<{ isAvailable: boolean }>> {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');
    
    const response = await fetch(`${this.baseURL}/deliveryman/availability`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isAvailable }),
    });
    return handleResponse<{ isAvailable: boolean }>(response);
  }

  async getDeliveryManById(id: string): Promise<ApiResponse<User>> {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');
    const response = await fetch(`${this.baseURL}/deliveryman/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse<User>(response);
  }

  async getAllFeedbacks(): Promise<ApiResponse<Order[]>> {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');
    const response = await fetch(`${this.baseURL}/orders/feedbacks`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse<Order[]>(response);
  }

  async getDeliveryNotifications(): Promise<ApiResponse<Order[]>> {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');
    const response = await fetch(`${this.baseURL}/delivery-notifications`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse<Order[]>(response);
  }

  async getDeliveryHistory(): Promise<ApiResponse<Order[]>> {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');
    const response = await fetch(`${this.baseURL}/orders/delivery/history`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse<Order[]>(response);
  }

  async getDeliveredOrders(): Promise<ApiResponse<Order[]>> {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');
    const response = await fetch(`${this.baseURL}/admin/ordershistory`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse<Order[]>(response);
  }

  // Profile and address management
  async updateProfile(profile: { name: string; email: string; phone: string; address: string }) {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');
    const response = await fetch(`${this.baseURL}/user/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(profile),
    });
    return handleResponse<User>(response);
  }

  async deleteAccount() {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');
    const response = await fetch(`${this.baseURL}/user/delete-account`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse<{ message: string }>(response);
  }

  async addAddress(address: Address) {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');
    const response = await fetch(`${this.baseURL}/user/address`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(address),
    });
    return handleResponse<User>(response);
  }

  async updateAddress(addressId: string, address: Address) {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');
    const response = await fetch(`${this.baseURL}/user/address/${addressId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(address),
    });
    return handleResponse<User>(response);
  }

  async deleteAddress(addressId: string) {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');
    const response = await fetch(`${this.baseURL}/user/address/${addressId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse<User>(response);
  }

  async getUserNotifications(): Promise<ApiResponse<Order[]>> {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');
    const response = await fetch(`${this.baseURL}/user-notifications`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse<Order[]>(response);
  }

  // Fetch all users (admin only)
  async getAllUsers(): Promise<ApiResponse<User[]>> {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');
    const response = await fetch(`${this.baseURL}/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse<User[]>(response);
  }

  // Delete a user (admin only)
  async deleteUser(userId: string): Promise<ApiResponse<void>> {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');
    const response = await fetch(`${this.baseURL}/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse<void>(response);
  }

  // Payment endpoints
  async createPaymentIntent(orderId: string): Promise<ApiResponse<{ clientSecret: string; paymentIntentId: string }>> {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${this.baseURL}/payment/create-payment-intent/${orderId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    const result = await handleResponse<{ clientSecret: string; paymentIntentId: string }>(response);
    return result;
  }

  async confirmPayment(paymentIntentId: string): Promise<ApiResponse<{ order: Order }>> {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${this.baseURL}/payment/confirm-payment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentIntentId }),
    });
    
    const result = await handleResponse<{ order: Order }>(response);
    return result;
  }

  async getPaymentStatus(orderId: string): Promise<ApiResponse<{ payment: any; status: string; totalAmount: number }>> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${this.baseURL}/payment/status/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse<{ payment: any; status: string; totalAmount: number }>(response);
  }


  async refundPayment(orderId: string, reason?: string): Promise<ApiResponse<{ order: Order; refundId: string }>> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${this.baseURL}/payment/refund/${orderId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    });
    return handleResponse<{ order: Order; refundId: string }>(response);
  }

  // Payment Model API methods
  async createPayment(paymentData: {
    orderId: string;
    amount: number;
    paymentMethod: 'card' | 'cash';
    stripePaymentId?: string;
  }): Promise<ApiResponse<Payment>> {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');

    const response = await fetch(`${this.baseURL}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(paymentData),
    });
    return handleResponse<Payment>(response);
  }

  async getPaymentById(paymentId: string): Promise<ApiResponse<Payment>> {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');

    const response = await fetch(`${this.baseURL}/payment/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse<Payment>(response);
  }

  async getUserPayments(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<{ payments: Payment[]; totalPages: number; currentPage: number; total: number }>> {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');

    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);

    const response = await fetch(`${this.baseURL}/payment/user/payments?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse<{ payments: Payment[]; totalPages: number; currentPage: number; total: number }>(response);
  }

  async updatePaymentStatus(paymentId: string, updateData: {
    paymentStatus?: string;
    stripeChargeId?: string;
    refundId?: string;
    refundReason?: string;
  }): Promise<ApiResponse<Payment>> {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');

    const response = await fetch(`${this.baseURL}/payment/${paymentId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });
    return handleResponse<Payment>(response);
  }
}

// Export singleton instance
export const apiService = new ApiService(API_BASE_URL); 