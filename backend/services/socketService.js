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


      socket.on('disconnect', () => {
        // User disconnected
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
