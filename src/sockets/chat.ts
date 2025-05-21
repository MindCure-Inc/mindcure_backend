import { Server, Socket } from 'socket.io';
import { saveMessage, getMessagesForUser, saveGroupMessage, getGroupMessages } from '../services/redisService';

export function registerChatHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    // One-to-one messaging
    socket.on('private-message', async ({ from, to, content }) => {
      await saveMessage(from, to, content);
      io.to(to).emit('private-message', { from, content });
    });
    // Group messaging
    socket.on('group-message', async ({ groupId, from, content }) => {
      await saveGroupMessage(groupId, from, content);
      io.to(groupId).emit('group-message', { from, content });
    });
    // Join/leave group rooms
    socket.on('join-group', ({ groupId }) => {
      socket.join(groupId);
    });
    socket.on('leave-group', ({ groupId }) => {
      socket.leave(groupId);
    });
  });
} 