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


      // Handle delivery location updates with improved performance
      socket.on('location-update', (data) => {
        console.log(`📍 Location update from delivery person:`, data);
        
        // Validate location data
        if (!data.orderId || !data.location || 
            typeof data.location.latitude !== 'number' || 
            typeof data.location.longitude !== 'number') {
          console.error('❌ Invalid location data received:', data);
          return;
        }

        // Broadcast location update to customer
        if (data.orderId) {
          // Get the order to find the user ID with timeout
          const Orders = require('../models/orderModel');
          const queryTimeout = setTimeout(() => {
            console.error('❌ Database query timeout for location update');
          }, 3000); // Reduced timeout for better performance

          Orders.findById(data.orderId)
            .populate('user', '_id')
            .maxTimeMS(3000) // Reduced MongoDB query timeout
            .then(order => {
              clearTimeout(queryTimeout);
              if (order && order.user) {
                // Enhanced location data with additional metadata
                const enhancedLocationData = {
                  orderId: data.orderId,
                  location: {
                    latitude: data.location.latitude,
                    longitude: data.location.longitude,
                    accuracy: data.location.accuracy || 10,
                    speed: data.location.speed || 0,
                    heading: data.location.heading || 0,
                    altitude: data.location.altitude || null,
                    altitudeAccuracy: data.location.altitudeAccuracy || null
                  },
                  timestamp: data.timestamp,
                  deliveryManId: socket.userId, // Track which delivery person sent this
                  updateType: 'real-time'
                };

                // Emit to both old and new event names for compatibility
                socket.to(`user-${order.user._id}`).emit('location-update', enhancedLocationData);
                socket.to(`user-${order.user._id}`).emit('delivery-location-update', enhancedLocationData);
                
                // Also emit to admin room for monitoring
                socket.to('admin').emit('delivery-location-update', {
                  ...enhancedLocationData,
                  customerId: order.user._id,
                  orderStatus: order.status
                });
                
                console.log(`📤 Location update sent to user ${order.user._id} and admin`);
              } else {
                console.log('❌ Order or user not found for location update');
              }
            })
            .catch(error => {
              clearTimeout(queryTimeout);
              console.error('Error finding order for location update:', error);
              // Emit error to delivery person for retry
              socket.emit('location-update-error', {
                orderId: data.orderId,
                error: 'Failed to broadcast location update'
              });
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
            .populate('deliveryMan', '_id name phone vehicleType currentLocation')
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
                // Also emit order-updated event for TrackOrder component
                socket.to(`user-${order.user._id}`).emit('order-updated', {
                  order: {
                    _id: order._id,
                    status: order.status,
                    customerLocation: order.customerLocation,
                    deliveryMan: order.deliveryMan ? {
                      _id: order.deliveryMan._id,
                      name: order.deliveryMan.name,
                      phone: order.deliveryMan.phone,
                      vehicleType: order.deliveryMan.vehicleType,
                      currentLocation: order.deliveryMan.currentLocation && order.deliveryMan.currentLocation.coordinates ? {
                        latitude: order.deliveryMan.currentLocation.coordinates[1],
                        longitude: order.deliveryMan.currentLocation.coordinates[0]
                      } : null
                    } : null
                  }
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

      // Handle delivery start event
      socket.on('delivery-started', (data) => {
        console.log(`🚀 Delivery started:`, data);
        if (data.orderId) {
          const Orders = require('../models/orderModel');
          Orders.findById(data.orderId)
            .populate('user', '_id')
            .populate('deliveryMan', '_id name phone')
            .then(order => {
              if (order && order.user) {
                // Notify customer
                socket.to(`user-${order.user._id}`).emit('delivery-started', {
                  orderId: data.orderId,
                  deliveryMan: order.deliveryMan,
                  estimatedDeliveryTime: data.estimatedDeliveryTime,
                  route: data.route
                });
                
                // Notify admins
                socket.to('admin').emit('delivery-started', {
                  orderId: data.orderId,
                  deliveryMan: order.deliveryMan,
                  customer: order.user
                });
                
                console.log(`📤 Delivery started notifications sent`);
              }
            })
            .catch(error => {
              console.error('Error finding order for delivery start:', error);
            });
        }
      });

      // Handle delivery completion event
      socket.on('delivery-completed', (data) => {
        console.log(`✅ Delivery completed:`, data);
        if (data.orderId) {
          const Orders = require('../models/orderModel');
          Orders.findById(data.orderId)
            .populate('user', '_id')
            .populate('deliveryMan', '_id name phone')
            .then(order => {
              if (order && order.user) {
                // Notify customer
                socket.to(`user-${order.user._id}`).emit('delivery-completed', {
                  orderId: data.orderId,
                  actualDeliveryTime: data.actualDeliveryTime,
                  deliveryNotes: data.deliveryNotes,
                  deliveryRating: data.deliveryRating
                });
                
                // Notify admins
                socket.to('admin').emit('delivery-completed', {
                  orderId: data.orderId,
                  deliveryMan: order.deliveryMan,
                  customer: order.user,
                  actualDeliveryTime: data.actualDeliveryTime
                });
                
                console.log(`📤 Delivery completed notifications sent`);
              }
            })
            .catch(error => {
              console.error('Error finding order for delivery completion:', error);
            });
        }
      });

      // Handle ETA updates
      socket.on('eta-update', (data) => {
        console.log(`⏰ ETA update:`, data);
        if (data.orderId) {
          const Orders = require('../models/orderModel');
          Orders.findById(data.orderId)
            .populate('user', '_id')
            .then(order => {
              if (order && order.user) {
                socket.to(`user-${order.user._id}`).emit('eta-update', {
                  orderId: data.orderId,
                  estimatedDeliveryTime: data.estimatedDeliveryTime,
                  remainingMinutes: data.remainingMinutes,
                  distance: data.distance
                });
                console.log(`📤 ETA update sent to user ${order.user._id}`);
              }
            })
            .catch(error => {
              console.error('Error finding order for ETA update:', error);
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
