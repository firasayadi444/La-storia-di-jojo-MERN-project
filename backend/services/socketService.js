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
        
        if (role === 'admin') {
          socket.join('admin');
        } else if (role === 'delivery') {
          socket.join('delivery');
          socket.join(`delivery-${userId}`);
        } else if (role === 'user') {
          socket.join(`user-${userId}`);
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
