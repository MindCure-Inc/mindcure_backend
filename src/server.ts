import dotenv from 'dotenv';
import http from 'http';
import app from './app'; // your Express app
import { Server as SocketIOServer } from 'socket.io';
import { registerMediasoupHandlers } from './sockets/mediasoup';
import { registerChatHandlers } from './sockets/chat';
import { Logger } from './utils/logger';

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

registerMediasoupHandlers(io);
registerChatHandlers(io);

server.listen(port, () => {
  Logger.info(`🚀 MindCure backend running on http://localhost:${port}`);
});
//TODO:Implement video calling and signaling using mediasoup