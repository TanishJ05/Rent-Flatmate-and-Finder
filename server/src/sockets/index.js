const { Server } = require('socket.io');
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
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: Missing token'));
      }

      const secret = process.env.SOCKET_TOKEN_SECRET || process.env.JWT_SECRET;
      const decoded = jwt.verify(token, secret);
      
      if (decoded.purpose !== 'socket') {
        return next(new Error('Authentication error: Invalid token purpose'));
      }

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

        // Verify if sender is actually a participant of this interest
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
        
        // Verify the sender is currently in the socket room
        const roomName = `interest:${interestId}`;
        if (!socket.rooms.has(roomName)) {
            return socket.emit('room_error', { message: 'You must join the room before sending a message' });
        }

        /* 
         * ARCHITECTURAL EXPLANATION:
         * We gate room access by querying the Interest document to ensure that only the verified 
         * owner or tenant of this specific conversation can join the room or send messages. 
         * Blindly trusting the client ID or relying solely on the client saying "I belong in this room" 
         * would allow malicious users to join any arbitrary room by simply guessing the interestId, 
         * leading to severe privacy leaks.
         * 
         * REST APIs vs. WebSockets for Chat:
         * - REST APIs are stateless, request-response driven, and strictly initiated by the client. 
         *   To get new messages, the client would have to continuously poll the server, which is 
         *   inefficient and resource-heavy.
         * - WebSockets provide a persistent, stateful, bi-directional connection. This allows the 
         *   server to instantly push (broadcast) new messages to all connected clients in the room 
         *   without the client having to ask for them, enabling true real-time communication.
         */

        // Persist message to MongoDB Message collection
        const message = new Message({
          interest: interestId,
          sender: socket.user._id,
          content: content
        });

        const savedMessage = await message.save();

        // Populate sender details before broadcasting
        const populatedMessage = await Message.findById(savedMessage._id)
          .populate('sender', 'name role');

        // Emit to all sockets in the room, including sender
        socket.to(roomName).emit('receive_message', populatedMessage);
        // Also send it back to the sender so they can render it
        socket.emit('receive_message', populatedMessage);
        
      } catch (err) {
        console.error('Send message error:', err);
        socket.emit('room_error', { message: 'Failed to send message' });
      }
    });

    // Future Improvement: Typing indicators
    // socket.on('typing', ({ interestId, isTyping }) => { ... })

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
};

module.exports = { initSockets };
