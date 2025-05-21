import dotenv from 'dotenv';
import http from 'http';
import app from './app'; // your Express app
import { setupMediasoup } from './mediasoupServer';
import { Server as SocketIOServer, Socket } from 'socket.io';

dotenv.config();

const port = process.env.PORT || 3000;

const server = http.createServer(app);

// Setup Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: '*', // 🔥 Change this to your frontend origin in prod for security
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket: Socket) => {
  console.log(`⚡️ Socket connected: ${socket.id}`);

  socket.on('join', (userId: string) => {
    console.log(`${userId} joined their room`);
    socket.join(userId);
  });

  socket.on('call-user', ({ from, to, signalData }) => {
    console.log(`${from} is calling ${to}`);
    io.to(to).emit('incoming-call', { from, signalData });
  });

  socket.on('answer-call', ({ from, to, signalData }) => {
    console.log(`${from} answered call from ${to}`);
    io.to(to).emit('call-accepted', { from, signalData });
  });

  socket.on('end-call', ({ from, to }) => {
    console.log(`${from} ended call with ${to}`);
    io.to(to).emit('call-ended', { from });
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Setup MediaSoup then start server
setupMediasoup(server)
  .then(() => {
    server.listen(port, () => {
      console.log(`🚀 MindCure + MediaSoup + Socket.IO running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('💥 Failed to setup MediaSoup:', err);
  });
//TODO:Implement video calling and signaling using mediasoup