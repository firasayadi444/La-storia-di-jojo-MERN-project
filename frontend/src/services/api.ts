const API_BASE_URL = 'http://localhost:5000/api';

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
  deliveryMan?: User;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  deliveryNotes?: string;
  deliveryRating?: number;
  foodRating?: number;
  feedbackComment?: string;
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

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
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

  // Food endpoints
  async getAllFoods(): Promise<ApiResponse<Food[]>> {
    const response = await fetch(`${this.baseURL}/foods`);
    return handleResponse<Food[]>(response);
  }

  async getFoodDetails(id: string): Promise<ApiResponse<Food>> {
    const response = await fetch(`${this.baseURL}/food/${id}`);
    return handleResponse<Food>(response);
  }

  async addFood(foodData: Omit<Food, '_id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Food>> {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');

    const response = await fetch(`${this.baseURL}/food/new`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(foodData),
    });
    return handleResponse<Food>(response);
  }

  async updateFood(id: string, foodData: Partial<Food>): Promise<ApiResponse<Food>> {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');

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
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');

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
}

// Export singleton instance
export const apiService = new ApiService(API_BASE_URL); 