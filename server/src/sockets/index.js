const { Server } = require('socket.io');
const cookie = require('cookie');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Interest = require('../models/Interest');
const Message = require('../models/Message');

const initSockets = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  // Socket auth middleware
  io.use(async (socket, next) => {
    try {
      if (!socket.handshake.headers.cookie) {
        return next(new Error('Authentication error: Missing cookies'));
      }
      
      const cookies = cookie.parse(socket.handshake.headers.cookie);
      const token = cookies.token;
      
      if (!token) {
        return next(new Error('Authentication error: Missing token'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id, 'User ID:', socket.user._id);

    // Join room for a specific interest
    socket.on('join_room', async ({ interestId }) => {
      try {
        const interest = await Interest.findById(interestId);
        
        if (!interest) {
          return socket.emit('room_error', { message: 'Interest not found' });
        }

        if (interest.status !== 'accepted') {
          return socket.emit('room_error', { message: 'Cannot join room: Interest is not accepted' });
        }

        const isParticipant = 
          interest.tenant.toString() === socket.user._id.toString() || 
          interest.owner.toString() === socket.user._id.toString();

        if (!isParticipant) {
          return socket.emit('room_error', { message: 'Not authorized to join this room' });
        }

        const roomName = `interest:${interestId}`;
        socket.join(roomName);
        console.log(`Socket ${socket.id} joined room ${roomName}`);
        
        // Future Improvement: Emit presence/online status here

      } catch (err) {
        socket.emit('room_error', { message: 'Failed to join room' });
      }
    });

    // Send a message
    socket.on('send_message', async ({ interestId, content }) => {
      try {
        const interest = await Interest.findById(interestId);
        
        if (!interest) {
          return socket.emit('room_error', { message: 'Interest not found' });
        }

        if (interest.status !== 'accepted') {
          return socket.emit('room_error', { message: 'Cannot send message: Interest is not accepted' });
        }

        const isParticipant = 
          interest.tenant.toString() === socket.user._id.toString() || 
          interest.owner.toString() === socket.user._id.toString();

        if (!isParticipant) {
          return socket.emit('room_error', { message: 'Not authorized to send messages to this room' });
        }

        // Persist message
        const message = await Message.create({
          interest: interestId,
          sender: socket.user._id,
          content
        });

        // Populate sender info for the client
        await message.populate('sender', 'name role');

        const roomName = `interest:${interestId}`;
        // Emit to all sockets in the room, including sender
        io.to(roomName).emit('receive_message', message);
        
      } catch (err) {
        socket.emit('room_error', { message: 'Failed to send message' });
      }
    });

    // Future Improvement: Typing indicators
    // socket.on('typing', ({ interestId, isTyping }) => { ... })

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};

module.exports = { initSockets };
