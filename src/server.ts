import dotenv from 'dotenv';
import http from 'http';
import app from './app'; 
import { Server as SocketIOServer } from 'socket.io';
import { registerChatHandlers } from './sockets/chat';
import { setupSocket } from './sockets/socket';
import { initializeMediasoup } from './mediasoup/server';
import { Logger } from './utils/logger';

dotenv.config();

const port = process.env.PORT || 3000;

const server = http.createServer(app);

// Setup Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: '*', // 🔥 Change this to your frontend origin in prod for security
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

initializeMediasoup()
  .then(() => {
    Logger.info('✅ Mediasoup initialized')
    setupSocket(server)

    registerChatHandlers(io);

    server.listen(port, () => {
      Logger.info(`🚀 MindCure backend running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    Logger.error('❌ Mediasoup failed to start:', err);
    process.exit(1);
  });
//TODO:Implement video calling and signaling using mediasoup