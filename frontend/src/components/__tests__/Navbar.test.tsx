import { render, screen } from '../../test/utils/test-utils'
import { Navbar } from '../Navbar'
import { vi } from 'vitest'

// Mock the useAuth hook
const mockUseAuth = vi.fn()
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

describe('Navbar Component', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      logout: vi.fn(),
    })
  })

  it('renders login and register buttons when not authenticated', () => {
    render(<Navbar />)
    
    expect(screen.getByText(/login/i)).toBeInTheDocument()
    expect(screen.getByText(/register/i)).toBeInTheDocument()
  })

  it('renders user menu when authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { _id: '1', name: 'Test User', role: 'user' },
      isAuthenticated: true,
      logout: vi.fn(),
    })

    render(<Navbar />)
    
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText(/logout/i)).toBeInTheDocument()
  })

  it('shows admin menu for admin users', () => {
    mockUseAuth.mockReturnValue({
      user: { _id: '1', name: 'Admin User', role: 'admin' },
      isAuthenticated: true,
      logout: vi.fn(),
    })

    render(<Navbar />)
    
    expect(screen.getByText(/admin/i)).toBeInTheDocument()
  })

  it('shows delivery menu for delivery users', () => {
    mockUseAuth.mockReturnValue({
      user: { _id: '1', name: 'Delivery User', role: 'delivery' },
      isAuthenticated: true,
      logout: vi.fn(),
    })

    render(<Navbar />)
    
    expect(screen.getByText(/delivery/i)).toBeInTheDocument()
  })
})
