# 🎨 Frontend Documentation - OrderApp

## Table des matières
1. [Architecture Frontend](#architecture-frontend)
2. [Configuration Technique](#configuration-technique)
3. [Structure des Composants](#structure-des-composants)
4. [Contextes et État Global](#contextes-et-état-global)
5. [Services et API](#services-et-api)
6. [Pages et Routage](#pages-et-routage)
7. [UI/UX et Design System](#uiux-et-design-system)
8. [Tests et Qualité](#tests-et-qualité)
9. [Déploiement](#déploiement)

---

## 🏗️ Architecture Frontend

### Stack Technologique

```json
{
  "framework": "React 18.3.1",
  "buildTool": "Vite 5.4.19",
  "language": "TypeScript 5.5.2",
  "styling": "Tailwind CSS 3.4.4",
  "uiLibrary": "Radix UI + shadcn/ui",
  "stateManagement": "React Context + TanStack Query",
  "routing": "React Router DOM 6.28.0",
  "forms": "React Hook Form + Zod",
  "maps": "Leaflet + React Leaflet",
  "notifications": "Sonner + Radix Toast",
  "testing": "Vitest + Testing Library"
}
```

### Structure du Projet

```
frontend/src/
├── components/          # Composants réutilisables
│   ├── ui/             # Composants UI de base (shadcn/ui)
│   ├── Navbar.tsx      # Navigation principale
│   ├── ProtectedRoute.tsx
│   └── NotificationCenter.tsx
├── contexts/           # Contextes React
│   ├── AuthContext.tsx
│   ├── CartContext.tsx
│   ├── SocketContext.tsx
│   └── AvailabilityContext.tsx
├── pages/              # Pages de l'application
│   ├── Home.tsx
│   ├── Login.tsx
│   ├── AdminDashboard.tsx
│   ├── DeliveryDashboard.tsx
│   └── Checkout.tsx
├── services/           # Services externes
│   └── api.ts
├── hooks/              # Hooks personnalisés
├── utils/              # Utilitaires
└── App.tsx            # Point d'entrée
```

---

## ⚙️ Configuration Technique

### 1. Vite Configuration

```typescript
// vite.config.ts
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 3000,
    https: false,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
```

### 2. Tailwind CSS Configuration

```typescript
// tailwind.config.ts
export default {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Thème restaurant italien
        italian: {
          green: {
            50: '#f0fdf4',
            700: '#007A4D', // Couleur principale
            900: '#14532d',
          },
          cream: {
            50: '#fefef9',
            500: '#f7d065',
          },
          red: {
            500: '#ef4444',
            700: '#b91c1c',
          }
        }
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #007A4D 0%, #16a34a 100%)',
        'gradient-hero': 'linear-gradient(135deg, #007A4D 0%, #22c55e 50%, #f0b429 100%)',
      },
      fontFamily: {
        'serif': ['Playfair Display', 'serif'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
        'bounce-gentle': 'bounce-gentle 2s infinite'
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
}
```

### 3. TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## 🧩 Structure des Composants

### 1. Composants UI (shadcn/ui)

#### Composants de Base
- **Button** - Boutons avec variantes (primary, secondary, destructive)
- **Card** - Cartes pour affichage de contenu
- **Dialog** - Modales et dialogues
- **Input** - Champs de saisie
- **Label** - Labels pour formulaires
- **Badge** - Badges de statut
- **Switch** - Interrupteurs
- **Toast** - Notifications toast

#### Composants Avancés
- **DropdownMenu** - Menus déroulants
- **Tabs** - Onglets
- **Accordion** - Accordéons
- **Progress** - Barres de progression
- **Avatar** - Avatars utilisateur
- **Tooltip** - Info-bulles

### 2. Composants Métier

#### Navigation
```typescript
// Navbar.tsx
const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { getTotalItems } = useCart();
  const { isAvailable, updateAvailability } = useAvailability();
  
  // Gestion des rôles et permissions
  // Affichage conditionnel des menus
  // Gestion de la disponibilité des livreurs
};
```

#### Protection des Routes
```typescript
// ProtectedRoute.tsx
interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireDelivery?: boolean;
  requireUser?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = false,
  requireAdmin = false,
  requireDelivery = false,
  requireUser = false
}) => {
  // Logique de protection des routes
  // Vérification des permissions
  // Redirection si non autorisé
};
```

---

## 🔄 Contextes et État Global

### 1. AuthContext - Gestion de l'Authentification

```typescript
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
```

**Fonctionnalités :**
- Gestion des tokens JWT
- Persistance dans localStorage
- Validation automatique des tokens
- Mise à jour de la disponibilité des livreurs

### 2. CartContext - Gestion du Panier

```typescript
interface CartContextType {
  items: CartItem[];
  addToCart: (food: Food, quantity?: number) => void;
  removeFromCart: (foodId: string) => void;
  updateQuantity: (foodId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}
```

**Fonctionnalités :**
- Persistance dans localStorage
- Synchronisation avec l'authentification
- Calcul automatique des totaux
- Gestion des quantités

### 3. SocketContext - Communication Temps Réel

```typescript
interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  registerRefreshCallback: (key: string, callback: () => void) => void;
  unregisterRefreshCallback: (key: string) => void;
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
}
```

**Fonctionnalités :**
- Connexion WebSocket automatique
- Gestion des rooms (admin, delivery, user-{id})
- Callbacks de rafraîchissement
- Reconnexion automatique

### 4. AvailabilityContext - Disponibilité des Livreurs

```typescript
interface AvailabilityContextType {
  isAvailable: boolean;
  updatingAvailability: boolean;
  updateAvailability: (isAvailable: boolean) => Promise<void>;
}
```

---

## 🌐 Services et API

### 1. Service API Principal

```typescript
// services/api.ts
class ApiService {
  private baseURL: string = '/api';
  
  // Authentification
  async login(credentials: LoginData): Promise<ApiResponse<{ user: User; token: string }>>
  async register(userData: RegisterData): Promise<ApiResponse<void>>
  async changePassword(passwordData: ChangePasswordData): Promise<ApiResponse<void>>
  
  // Gestion des aliments
  async getAllFoods(): Promise<ApiResponse<Food[]>>
  async getFoodDetails(id: string): Promise<ApiResponse<Food>>
  async addFood(foodData: FormData): Promise<ApiResponse<Food>>
  async updateFood(id: string, foodData: Partial<Food>): Promise<ApiResponse<Food>>
  async deleteFood(id: string): Promise<ApiResponse<void>>
  
  // Gestion des commandes
  async makeOrder(orderData: OrderData): Promise<ApiResponse<Order>>
  async getAllOrders(): Promise<ApiResponse<Order[]>>
  async getUserOrders(): Promise<ApiResponse<Order[]>>
  async getDeliveryOrders(): Promise<ApiResponse<Order[]>>
  async updateOrderStatus(orderId: string, updateData: OrderUpdateData): Promise<ApiResponse<Order>>
  async cancelOrder(id: string): Promise<ApiResponse<Order>>
  
  // Gestion des paiements
  async createPaymentIntent(orderId: string): Promise<ApiResponse<{ clientSecret: string; paymentIntentId: string }>>
  async confirmPayment(paymentIntentId: string): Promise<ApiResponse<{ order: Order }>>
  async getPaymentStatus(orderId: string): Promise<ApiResponse<PaymentStatus>>
  async refundPayment(orderId: string, reason?: string): Promise<ApiResponse<{ order: Order; refundId: string }>>
  
  // Gestion des livreurs
  async getPendingDeliveryMen(): Promise<ApiResponse<User[]>>
  async getAllDeliveryMen(): Promise<ApiResponse<User[]>>
  async updateDeliveryAvailability(isAvailable: boolean): Promise<ApiResponse<{ isAvailable: boolean }>>
  async getDeliveryNotifications(): Promise<ApiResponse<Order[]>>
  async getDeliveryHistory(): Promise<ApiResponse<Order[]>>
}
```

### 2. Types TypeScript

```typescript
// Types principaux
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
  payment?: Payment | string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## 📄 Pages et Routage

### 1. Configuration des Routes

```typescript
// App.tsx
<BrowserRouter>
  <Routes>
    {/* Routes publiques */}
    <Route path="/" element={<Home />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/food/:id" element={<FoodDetail />} />
    
    {/* Routes protégées - Utilisateurs */}
    <Route path="/cart" element={<ProtectedRoute requireAuth><Cart /></ProtectedRoute>} />
    <Route path="/checkout" element={<ProtectedRoute requireAuth><Checkout /></ProtectedRoute>} />
    <Route path="/orders" element={<ProtectedRoute requireAuth requireUser><UserOrders /></ProtectedRoute>} />
    <Route path="/orders/history" element={<ProtectedRoute requireAuth requireUser><UserOrdersHistory /></ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute requireAuth requireUser><Profile /></ProtectedRoute>} />
    
    {/* Routes protégées - Livreurs */}
    <Route path="/delivery" element={<ProtectedRoute requireAuth requireDelivery><DeliveryDashboard /></ProtectedRoute>} />
    <Route path="/delivery-stats" element={<ProtectedRoute requireAuth requireDelivery><DeliveryStats /></ProtectedRoute>} />
    <Route path="/delivery-history" element={<ProtectedRoute requireAuth requireDelivery><DeliveryHistory /></ProtectedRoute>} />
    
    {/* Routes protégées - Admin */}
    <Route path="/admin/orders" element={<ProtectedRoute requireAuth requireAdmin><AdminOrders /></ProtectedRoute>} />
    <Route path="/admin/users" element={<ProtectedRoute requireAuth requireAdmin><AdminUsers /></ProtectedRoute>} />
    <Route path="/admin/feedbacks" element={<ProtectedRoute requireAuth requireAdmin><AdminFeedbacks /></ProtectedRoute>} />
    <Route path="/admin/analytics" element={<ProtectedRoute requireAuth requireAdmin><AdminAnalytics /></ProtectedRoute>} />
    <Route path="/admin/add-food" element={<ProtectedRoute requireAuth requireAdmin><AdminFoodManagement /></ProtectedRoute>} />
    <Route path="/admin/ordershistory" element={<ProtectedRoute requireAuth requireAdmin><AdminOrdersHistory /></ProtectedRoute>} />
    
    {/* Route 404 */}
    <Route path="*" element={<NotFound />} />
  </Routes>
</BrowserRouter>
```

### 2. Pages Principales

#### Page d'Accueil (Home)
- Affichage des plats disponibles
- Filtrage par catégorie
- Recherche de plats
- Interface responsive

#### Dashboard Admin (AdminDashboard)
- Vue d'ensemble des commandes
- Gestion des utilisateurs
- Gestion des livreurs
- Analytics et statistiques

#### Dashboard Livreur (DeliveryDashboard)
- Commandes assignées
- Gestion de la disponibilité
- Notifications en temps réel
- Historique des livraisons

#### Page de Commande (Checkout)
- Récapitulatif du panier
- Sélection du mode de paiement
- Saisie de l'adresse de livraison
- Intégration Stripe

---

## 🎨 UI/UX et Design System

### 1. Thème Visuel

#### Palette de Couleurs
```css
/* Couleurs principales */
--italian-green-50: #f0fdf4;
--italian-green-700: #007A4D;  /* Couleur principale */
--italian-green-900: #14532d;

--italian-cream-50: #fefef9;
--italian-cream-500: #f7d065;

--italian-red-500: #ef4444;
--italian-red-700: #b91c1c;
```

#### Typographie
```css
/* Polices */
font-family: 'Inter', system-ui, sans-serif;  /* Texte principal */
font-family: 'Playfair Display', serif;       /* Titres */
```

#### Gradients
```css
/* Gradients personnalisés */
.gradient-primary {
  background: linear-gradient(135deg, #007A4D 0%, #16a34a 100%);
}

.gradient-hero {
  background: linear-gradient(135deg, #007A4D 0%, #22c55e 50%, #f0b429 100%);
}
```

### 2. Composants UI Personnalisés

#### Cartes de Plats
```typescript
const FoodCard: React.FC<{ food: Food }> = ({ food }) => {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300">
      <CardContent className="p-0">
        <div className="relative overflow-hidden rounded-t-lg">
          <img 
            src={food.image} 
            alt={food.name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <Badge className="absolute top-2 right-2 bg-italian-green-700">
            €{food.price}
          </Badge>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-2">{food.name}</h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{food.description}</p>
          <Button className="w-full bg-italian-green-700 hover:bg-italian-green-800">
            Ajouter au panier
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
```

#### Indicateurs de Statut
```typescript
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending': return { color: 'bg-yellow-100 text-yellow-800', icon: Clock };
      case 'confirmed': return { color: 'bg-blue-100 text-blue-800', icon: CheckCircle };
      case 'preparing': return { color: 'bg-orange-100 text-orange-800', icon: ChefHat };
      case 'ready': return { color: 'bg-purple-100 text-purple-800', icon: Package };
      case 'out_for_delivery': return { color: 'bg-indigo-100 text-indigo-800', icon: Truck };
      case 'delivered': return { color: 'bg-green-100 text-green-800', icon: CheckCircle };
      case 'cancelled': return { color: 'bg-red-100 text-red-800', icon: XCircle };
      default: return { color: 'bg-gray-100 text-gray-800', icon: AlertCircle };
    }
  };

  const { color, icon: Icon } = getStatusConfig(status);
  
  return (
    <Badge className={`${color} flex items-center gap-1`}>
      <Icon className="h-3 w-3" />
      {status.replace('_', ' ')}
    </Badge>
  );
};
```

### 3. Animations et Transitions

```css
/* Animations personnalisées */
@keyframes fade-in {
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}

@keyframes scale-in {
  0% { transform: scale(0.95); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes bounce-gentle {
  0%, 100% { transform: translateY(-2%); }
  50% { transform: translateY(0); }
}

.animate-fade-in { animation: fade-in 0.5s ease-out; }
.animate-scale-in { animation: scale-in 0.3s ease-out; }
.animate-bounce-gentle { animation: bounce-gentle 2s infinite; }
```

---

## 🧪 Tests et Qualité

### 1. Configuration des Tests

```typescript
// vitest.config.ts
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

### 2. Utilitaires de Test

```typescript
// test/utils/test-utils.tsx
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const customRender = (ui: React.ReactElement, options?: RenderOptions) =>
  render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

### 3. Exemples de Tests

```typescript
// __tests__/components/FoodCard.test.tsx
import { render, screen } from '../utils/test-utils';
import { FoodCard } from '../../components/FoodCard';

const mockFood = {
  _id: '1',
  name: 'Pizza Margherita',
  description: 'Tomate, mozzarella, basilic',
  price: 12.99,
  category: 'Pizza',
  image: '/pizza.jpg',
  available: true,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01'
};

describe('FoodCard', () => {
  it('affiche les informations du plat', () => {
    render(<FoodCard food={mockFood} />);
    
    expect(screen.getByText('Pizza Margherita')).toBeInTheDocument();
    expect(screen.getByText('€12.99')).toBeInTheDocument();
    expect(screen.getByText('Ajouter au panier')).toBeInTheDocument();
  });
});
```

---

## 🚀 Déploiement

### 1. Configuration Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
RUN npm ci --only=production

# Copier le code source
COPY . .

# Build de l'application
RUN npm run build

# Serveur de production
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

### 2. Configuration Nginx

```nginx
# nginx-config/default.conf
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gestion des routes SPA
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy vers l'API backend
    location /api {
        proxy_pass http://backend:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Cache des assets statiques
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 3. Scripts de Build

```json
{
  "scripts": {
    "dev": "vite",
    "dev:https": "node https-proxy.js",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

### 4. Variables d'Environnement

```bash
# .env.development
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_APP_NAME=OrderApp
VITE_APP_VERSION=1.0.0

# .env.production
VITE_API_URL=https://api.orderapp.com/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_APP_NAME=OrderApp
VITE_APP_VERSION=1.0.0
```

---

## 📱 Responsive Design

### 1. Breakpoints

```css
/* Tailwind CSS breakpoints */
sm: '640px'   /* Mobile large */
md: '768px'   /* Tablet */
lg: '1024px'  /* Desktop small */
xl: '1280px'  /* Desktop large */
2xl: '1536px' /* Desktop extra large */
```

### 2. Composants Responsive

```typescript
const ResponsiveGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {children}
    </div>
  );
};
```

### 3. Navigation Mobile

```typescript
const MobileMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="md:hidden"
        onClick={() => setIsOpen(true)}
      >
        <Menu className="h-6 w-6" />
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          {/* Contenu du menu mobile */}
        </DialogContent>
      </Dialog>
    </>
  );
};
```

---

## 🔧 Optimisations

### 1. Lazy Loading

```typescript
// Lazy loading des pages
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const DeliveryDashboard = lazy(() => import('./pages/DeliveryDashboard'));

// Utilisation avec Suspense
<Suspense fallback={<div>Loading...</div>}>
  <AdminDashboard />
</Suspense>
```

### 2. Mémorisation des Composants

```typescript
const FoodCard = memo<{ food: Food }>(({ food }) => {
  // Composant mémorisé pour éviter les re-renders inutiles
  return (
    <Card>
      {/* Contenu du composant */}
    </Card>
  );
});
```

### 3. Optimisation des Images

```typescript
const OptimizedImage: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="w-full h-48 object-cover"
      onError={(e) => {
        e.currentTarget.src = '/placeholder.svg';
      }}
    />
  );
};
```

---

## 📊 Monitoring et Analytics

### 1. Gestion des Erreurs

```typescript
// Error Boundary
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Envoyer l'erreur à un service de monitoring
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }

    return this.props.children;
  }
}
```

### 2. Performance Monitoring

```typescript
// Hook pour mesurer les performances
const usePerformance = () => {
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.log('Performance entry:', entry);
      }
    });
    
    observer.observe({ entryTypes: ['measure', 'navigation'] });
    
    return () => observer.disconnect();
  }, []);
};
```

---

*Documentation générée le ${new Date().toLocaleDateString('fr-FR')}*
