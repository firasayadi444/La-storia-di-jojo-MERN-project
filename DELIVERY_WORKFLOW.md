# Delivery Workflow Documentation

## Overview
This document explains how the delivery assignment and status update workflow works in the food delivery application.

## Delivery Assignment Process

### 1. Order Status Flow
```
pending → confirmed → preparing → ready → out_for_delivery → delivered
```

### 2. Delivery Man Assignment
- **When**: Orders reach "ready" status
- **Who**: Admin assigns available delivery men
- **How**: Admin selects from available delivery men in the admin dashboard
- **Validation**: Only available delivery men can be assigned

### 3. Delivery Man Notifications
- **Real-time**: Delivery men receive notifications for new assignments
- **Dashboard**: New assignments appear in the "New Assignments" section
- **Email**: Optional email notifications (if SMTP configured)

## Delivery Status Management

### Available Status Transitions
- **ready** → **out_for_delivery**: Delivery man starts delivery
- **out_for_delivery** → **delivered**: Delivery man completes delivery

### Status Update Process

#### Starting Delivery (ready → out_for_delivery)
1. Delivery man sees order in "Active Deliveries" section
2. Clicks "Start Delivery" button
3. Confirmation dialog appears
4. Status updates to "out_for_delivery"
5. Order moves to "out_for_delivery" section

#### Completing Delivery (out_for_delivery → delivered)
1. Delivery man sees order in "out_for_delivery" section
2. Clicks "Mark Delivered" button
3. Confirmation dialog with optional delivery notes
4. Status updates to "delivered"
5. Order moves to "Completed Deliveries" section
6. Delivery man earns commission (15% of order total)

## Availability Management

### Availability Rules
- ✅ **Can go available**: When no active deliveries
- ❌ **Cannot go unavailable**: When has active orders (ready/out_for_delivery)
- 🔄 **Auto-refresh**: Availability status updates every 30 seconds

### Visual Indicators
- 🟢 **Available**: Green WiFi icon
- 🔴 **Unavailable**: Red WiFi-off icon
- 🟠 **Active Deliveries**: Orange badge when has active orders

## Delivery Dashboard Features

### Real-time Updates
- **Notifications**: New assignments appear immediately
- **Status Changes**: Order status updates in real-time
- **Earnings**: Live calculation of delivery earnings

### Order Information Display
- **Customer Details**: Name, phone, delivery address
- **Order Details**: Items, total amount, estimated delivery time
- **Status Tracking**: Current status with color-coded badges
- **Delivery Notes**: Optional notes for completed deliveries

### Earnings Tracking
- **Per Delivery**: 15% commission on order total
- **Total Earnings**: Sum of all completed deliveries
- **Monthly Breakdown**: Earnings organized by month
- **Statistics**: Average earnings per delivery

## API Endpoints

### For Delivery Men
- `GET /orders/delivery` - Get assigned orders
- `GET /delivery-notifications` - Get new assignments
- `GET /orders/delivery/history` - Get completed deliveries
- `PUT /orders/:id/status` - Update order status
- `PUT /deliveryman/availability` - Update availability

### For Admins
- `GET /delivery-men` - Get available delivery men
- `PUT /orders/:id/status` - Assign delivery men to orders

## Error Handling

### Common Scenarios
1. **No Active Orders**: Clear message when no deliveries assigned
2. **Network Errors**: Retry mechanism with user feedback
3. **Invalid Status Transitions**: Backend validation prevents invalid changes
4. **Availability Conflicts**: Prevents going unavailable with active orders

### User Feedback
- **Success Messages**: Clear confirmation for each action
- **Error Messages**: Descriptive error explanations
- **Loading States**: Visual feedback during operations
- **Toast Notifications**: Non-intrusive status updates

## Best Practices

### For Delivery Men
1. **Check Availability**: Ensure you're available before accepting assignments
2. **Update Status Promptly**: Mark orders as delivered immediately after completion
3. **Add Delivery Notes**: Provide useful feedback for completed deliveries
4. **Monitor Notifications**: Check for new assignments regularly

### For Admins
1. **Assign Promptly**: Assign delivery men as soon as orders are ready
2. **Monitor Availability**: Check delivery man availability before assignment
3. **Track Performance**: Monitor delivery completion rates
4. **Handle Issues**: Address delivery problems promptly

## Security Features

### Authentication
- **JWT Tokens**: Secure authentication for all API calls
- **Role-based Access**: Only delivery men can update their assigned orders
- **Session Management**: Automatic token refresh and logout

### Data Validation
- **Backend Validation**: Server-side validation of all status changes
- **Frontend Validation**: Client-side checks for better UX
- **Status Transition Rules**: Strict rules for order status changes

## Troubleshooting

### Common Issues
1. **Orders not appearing**: Check if delivery man is assigned
2. **Status not updating**: Verify network connection and permissions
3. **Availability not changing**: Check for active orders blocking the change
4. **Notifications not showing**: Refresh dashboard or check notification settings

### Support
- **Error Logs**: Check browser console for detailed error messages
- **API Responses**: Review network tab for API call details
- **Status Validation**: Verify order status in admin dashboard 