# OrderApp - Food Delivery Platform

A modern, full-stack food delivery application built with React, Node.js, and MongoDB.

## Features

- 🍕 **Food Management**: Browse and manage food items with categories
- 🛒 **Shopping Cart**: Add items to cart with quantity management
- 💳 **Payment Processing**: Secure payment with Stripe integration
- 📱 **Real-time Tracking**: Live delivery tracking with Socket.io
- 👥 **User Management**: Customer, admin, and delivery person roles
- 📊 **Analytics Dashboard**: Comprehensive order and delivery analytics
- 🗺️ **Location Services**: GPS-based delivery tracking
- ⭐ **Rating System**: Customer feedback and rating system

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **React Router** for navigation
- **Socket.io Client** for real-time features
- **Leaflet** for maps and location services

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **Socket.io** for real-time communication
- **JWT** for authentication
- **Stripe** for payment processing
- **bcryptjs** for password hashing

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd OrderApp
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Backend environment variables
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the application**
   ```bash
   # Start backend server
   cd backend
   npm run dev

   # Start frontend development server
   cd frontend
   npm run dev
   ```

## Project Structure

```
OrderApp/
├── backend/                 # Node.js backend
│   ├── controllers/         # Route controllers
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   ├── middlewares/        # Custom middlewares
│   └── utils/              # Utility functions
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   ├── services/       # API services
│   │   └── utils/          # Utility functions
│   └── public/             # Static assets
└── k8s-manifestes/         # Kubernetes deployment files
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/change-password` - Change password

### Food Management
- `GET /api/foods` - Get all foods
- `POST /api/foods` - Create food (Admin)
- `PUT /api/foods/:id` - Update food (Admin)
- `DELETE /api/foods/:id` - Delete food (Admin)

### Orders
- `GET /api/orders` - Get user orders
- `POST /api/orders` - Create order
- `PUT /api/orders/:id` - Update order status
- `GET /api/orders/history` - Get order history

### Users
- `GET /api/users` - Get all users (Admin)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin)

## Deployment

### Docker
```bash
# Build and run with Docker Compose
docker-compose up --build
```

### Kubernetes
```bash
# Apply Kubernetes manifests
kubectl apply -f k8s-manifestes/
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@orderapp.com or create an issue in the repository.