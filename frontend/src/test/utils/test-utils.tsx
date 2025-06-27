import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '../../contexts/AuthContext'
import { CartProvider } from '../../contexts/CartContext'
import { AvailabilityProvider } from '../../contexts/AvailabilityContext'
import { AppProvider } from '../../contexts/AppContext'

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AvailabilityProvider>
            <CartProvider>
              <AppProvider>
                {children}
              </AppProvider>
            </CartProvider>
          </AvailabilityProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'

// Override render method
export { customRender as render }

// Mock data for testing
export const mockUser = {
  _id: '1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'user' as const,
  phone: '1234567890',
}

export const mockAdmin = {
  _id: '2',
  name: 'Admin User',
  email: 'admin@example.com',
  role: 'admin' as const,
  phone: '1234567890',
}

export const mockDeliveryMan = {
  _id: '3',
  name: 'Delivery Man',
  email: 'delivery@example.com',
  role: 'delivery' as const,
  phone: '1234567890',
  isAvailable: true,
}

export const mockFood = {
  _id: '1',
  name: 'Test Pizza',
  description: 'Delicious test pizza',
  price: 15.99,
  category: 'Pizza',
  image: 'test-pizza.jpg',
  available: true,
}

export const mockOrder = {
  _id: '1',
  user: mockUser._id,
  items: [
    {
      food: mockFood._id,
      quantity: 2,
      price: mockFood.price,
    },
  ],
  totalAmount: 31.98,
  status: 'pending',
  deliveryAddress: '123 Test St, Test City',
  paymentMethod: 'card',
  createdAt: new Date().toISOString(),
}

// Mock API responses
export const mockApiResponses = {
  foods: [mockFood],
  orders: [mockOrder],
  user: mockUser,
}

// Helper function to mock API calls
export const mockApiCall = (endpoint: string, response: any) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => response,
  })
}

// Helper function to mock failed API calls
export const mockApiError = (endpoint: string, error: string) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status: 400,
    json: async () => ({ message: error }),
  })
} 