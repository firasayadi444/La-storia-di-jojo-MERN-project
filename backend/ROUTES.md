# Backend Routes Documentation

## Base URL
All routes are prefixed with `/api`

## Authentication Routes (`/auth`)
- `POST /register` - Register a new user
- `POST /login` - Login user

## User Routes (`/users`)
- `GET /users` - Get all users (Admin only)
- `DELETE /user/:id` - Delete a user (Admin only)

## Food Routes (`/foods`)
- `POST /food/new` - Add new food (Admin only)
- `GET /foods` - Get all available foods (Public)
- `GET /food/:id` - Get food details (Public)
- `PUT /food/:id` - Update food (Admin only)
- `DELETE /food/:id` - Delete food (Admin only)

## Order Routes (`/orders`)
- `GET /test` - Test route (Public)
- `POST /order/new` - Create new order (Authenticated)
- `GET /orders` - Get all orders (Authenticated)
- `GET /orders/user` - Get user's orders (Authenticated)
- `GET /orders/delivery` - Get delivery orders (Delivery man)
- `GET /delivery-men` - Get available delivery men (Authenticated)
- `PUT /orders/:id/status` - Update order status (Authenticated)
- `DELETE /orders/:id` - Delete order (Authenticated)
- `POST /orders/:id/feedback` - Submit feedback (Authenticated)
- `GET /orders/feedbacks` - Get all feedbacks (Public)
- `GET /delivery-notifications` - Get delivery notifications (Delivery man)

## Deliveryman Routes (`/deliveryman`)
- `POST /apply` - Apply to be delivery man (Public)
- `GET /pending` - Get pending applications (Admin only)
- `POST /approve/:id` - Approve application (Admin only)
- `POST /reject/:id` - Reject application (Admin only)
- `GET /all` - Get all delivery men (Admin only)
- `GET /:id` - Get delivery man by ID (Authenticated)

## Frontend API Calls
The frontend makes the following calls:
- `GET /api/foods` ✅
- `GET /api/food/:id` ✅
- `POST /api/food/new` ✅
- `PUT /api/food/:id` ✅
- `DELETE /api/food/:id` ✅
- `GET /api/orders` ✅
- `GET /api/orders/user` ✅
- `GET /api/orders/delivery` ✅
- `GET /api/delivery-men` ✅
- `PUT /api/orders/:id/status` ✅
- `DELETE /api/orders/:id` ✅
- `POST /api/orders/:id/feedback` ✅
- `GET /api/orders/feedbacks` ✅
- `GET /api/delivery-notifications` ✅
- `GET /api/deliveryman/pending` ✅
- `GET /api/deliveryman/all` ✅
- `GET /api/deliveryman/:id` ✅

## Issues Found and Fixed
1. ✅ Fixed missing `nodemailer` and `multer` dependencies
2. ✅ Fixed deprecated `remove()` method in userController
3. ✅ Fixed incorrect import of `adminAuthMiddleware` in userRoutes
4. ✅ Added default JWT_SECRET and DB environment variables
5. ✅ Added better error handling and debugging logs
6. ✅ Added route logging middleware for debugging

## Testing
Run the test server:
```bash
node test-routes.js
```

Then test the endpoints:
- `GET http://localhost:5000/test` - Should return "Server is working"
- `GET http://localhost:5000/routes` - Should list all routes
- `GET http://localhost:5000/api/test` - Should return "Order route is working"
- `GET http://localhost:5000/api/foods` - Should return food list (if any) 