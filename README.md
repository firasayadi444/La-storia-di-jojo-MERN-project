# La Storia Di JoJo - MERN Food Delivery App

A full-stack food delivery application built with the MERN stack (MongoDB, Express.js, React.js, Node.js) featuring admin management, delivery man applications, and customer ordering system.

## 🍕 Features

### Customer Features
- Browse food menu with categories
- Add items to cart
- Place orders with delivery address
- Track order status
- Submit feedback and ratings
- Payment method selection (Card/Cash)

### Delivery Man Features
- Apply for delivery position with photo uploads
- View assigned orders
- Update delivery status
- Receive notifications
- 20% discount on orders

### Admin Features
- **Dashboard**: Overview with statistics and charts
- **Food Management**: Add, edit, delete food items
- **Order Management**: View and update order statuses
- **Delivery Men Management**: Approve/reject applications, view details
- **Analytics**: Revenue charts, feedback analysis
- **Customer Feedback**: View all customer feedback and ratings

## 🚀 Tech Stack

### Frontend
- **React.js** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Shadcn/ui** for UI components
- **React Router** for navigation
- **Context API** for state management

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Multer** for file uploads
- **Nodemailer** for email notifications
- **bcrypt** for password hashing

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- Git

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/firasayadi444/La-storia-di-jojo-MERN-project.git
   cd La-storia-di-jojo-MERN-project
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Setup**
   
   Create `.env` file in the backend directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/la-storia-di-jojo
   JWT_SECRET=your_jwt_secret_here
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_email_password
   PORT=5000
   ```

4. **Database Setup**
   ```bash
   cd backend
   npm run seed
   ```

5. **Run the application**
   ```bash
   # Start backend server (from backend directory)
   npm start
   
   # Start frontend development server (from frontend directory)
   npm run dev
   ```

## 🗂️ Project Structure

```
OrderApp/
├── backend/                 # Backend API
│   ├── controllers/        # Route controllers
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── middlewares/       # Custom middlewares
│   ├── utils/             # Utility functions
│   ├── uploads/           # File uploads
│   └── server.js          # Express server
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   ├── services/      # API services
│   │   └── hooks/         # Custom hooks
│   └── public/            # Static assets
└── README.md
```

## 👥 User Roles

### Admin
- Email: `admin@food.com`
- Password: `password`
- Full access to all features

### Customer
- Email: `user@food.com`
- Password: `password`
- Can order food and submit feedback

### Delivery Man
- Email: `marco@delivery.com`
- Password: `password`
- Can view assigned orders and update status

## 🔧 API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/register` - User registration

### Food
- `GET /api/foods` - Get all foods
- `POST /api/food/new` - Add new food (admin)
- `PUT /api/food/:id` - Update food (admin)
- `DELETE /api/food/:id` - Delete food (admin)

### Orders
- `POST /api/order/new` - Create new order
- `GET /api/orders` - Get all orders (admin)
- `GET /api/orders/user` - Get user orders
- `PUT /api/orders/:id/status` - Update order status
- `GET /api/orders/feedbacks` - Get all feedbacks (admin)

### Delivery Men
- `POST /api/deliveryman/apply` - Apply for delivery position
- `GET /api/deliveryman/pending` - Get pending applications
- `GET /api/deliveryman/all` - Get all delivery men (admin)
- `POST /api/deliveryman/approve/:id` - Approve application (admin)
- `POST /api/deliveryman/reject/:id` - Reject application (admin)

## 🎨 Features Overview

### Admin Dashboard
- Real-time statistics
- Revenue charts with PDF export
- Order management
- Delivery man analytics
- Customer feedback overview

### Order Management
- Status tracking (pending → confirmed → preparing → ready → out_for_delivery → delivered)
- Delivery man assignment
- Estimated delivery times
- Customer feedback collection

### Delivery System
- Application workflow with photo uploads
- Email notifications for approval/rejection
- Order assignment and status updates
- Performance tracking

## 📱 Screenshots

*Add screenshots of your application here*

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Firas Ayadi**
- GitHub: [@firasayadi444](https://github.com/firasayadi444)

## 🙏 Acknowledgments

- Shadcn/ui for beautiful UI components
- Tailwind CSS for utility-first styling
- MongoDB for flexible database solution 