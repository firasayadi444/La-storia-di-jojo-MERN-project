import { render, screen } from '../../test/utils/test-utils'
import { FoodCard } from '../FoodCard'
import { mockFood } from '../../test/utils/test-utils'
import { vi } from 'vitest'

// Mock the useAuth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { _id: '1', role: 'user' },
    isAuthenticated: true,
  }),
}))

describe('FoodCard Component', () => {
  it('renders food information correctly', () => {
    render(<FoodCard food={mockFood} />)
    
    expect(screen.getByText('Test Pizza')).toBeInTheDocument()
    expect(screen.getByText('Delicious test pizza')).toBeInTheDocument()
    expect(screen.getByText('$15.99')).toBeInTheDocument()
    expect(screen.getByText('Pizza')).toBeInTheDocument()
  })

  it('shows add to cart button for authenticated users', () => {
    render(<FoodCard food={mockFood} />)
    
    expect(screen.getByRole('button', { name: /add to cart/i })).toBeInTheDocument()
  })

  it('displays food image with correct alt text', () => {
    render(<FoodCard food={mockFood} />)
    
    const image = screen.getByRole('img')
    expect(image).toHaveAttribute('alt', 'Test Pizza')
  })

  it('shows unavailable status for unavailable food', () => {
    const unavailableFood = { ...mockFood, available: false }
    render(<FoodCard food={unavailableFood} />)
    
    expect(screen.getByText(/unavailable/i)).toBeInTheDocument()
  })
})
