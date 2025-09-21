const { Server } = require('socket.io');

class SocketService {
  constructor() {
    this.io = null;
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    this.io.on('connection', (socket) => {
      // Join user to specific rooms based on their role
      socket.on('join-room', (data) => {
        const { userId, role } = data;
        console.log(`🔗 User ${userId} with role ${role} joining rooms`);
        
        if (role === 'admin') {
          socket.join('admin');
          console.log(`✅ Admin ${userId} joined admin room`);
        } else if (role === 'delivery') {
          socket.join('delivery');
          socket.join(`delivery-${userId}`);
          console.log(`✅ Delivery ${userId} joined delivery rooms`);
        } else if (role === 'user') {
          socket.join(`user-${userId}`);
          console.log(`✅ User ${userId} joined user room`);
        }
      });


      // Handle delivery location updates
      socket.on('location-update', (data) => {
        console.log(`📍 Location update from delivery person:`, data);
        // Broadcast location update to customer
        if (data.orderId) {
          // Get the order to find the user ID
          const Orders = require('../models/orderModel');
          Orders.findById(data.orderId)
            .populate('user', '_id')
            .then(order => {
              if (order && order.user) {
                socket.to(`user-${order.user._id}`).emit('location-update', {
                  orderId: data.orderId,
                  location: data.location,
                  timestamp: data.timestamp
                });
                console.log(`📤 Location update sent to user ${order.user._id}`);
              } else {
                console.log('❌ Order or user not found for location update');
              }
            })
            .catch(error => {
              console.error('Error finding order for location update:', error);
            });
        }
      });

      // Handle delivery status updates
      socket.on('delivery-update', (data) => {
        console.log(`🚚 Delivery update:`, data);
        // Broadcast delivery update to customer
        if (data.orderId) {
          // Get the order to find the user ID
          const Orders = require('../models/orderModel');
          Orders.findById(data.orderId)
            .populate('user', '_id')
            .then(order => {
              if (order && order.user) {
                socket.to(`user-${order.user._id}`).emit('delivery-update', {
                  orderId: data.orderId,
                  status: data.status,
                  deliveryNotes: data.deliveryNotes,
                  estimatedDeliveryTime: data.estimatedDeliveryTime,
                  actualDeliveryTime: data.actualDeliveryTime,
                  location: data.location
                });
                console.log(`📤 Delivery update sent to user ${order.user._id}`);
              } else {
                console.log('❌ Order or user not found for delivery update');
              }
            })
            .catch(error => {
              console.error('Error finding order for delivery update:', error);
            });
        }
      });

      socket.on('disconnect', () => {
        console.log(`👋 User disconnected: ${socket.id}`);
      });
    });

    return this.io;
  }

  // Get the io instance
  getIO() {
    return this.io;
  }
}

module.exports = new SocketService();
