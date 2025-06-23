import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { mapExternalIdToInternal, getActiveConnection } from '../utils/idMapper';
import { handleMediasoupEvents } from '../mediasoup/handlers';
import { createCallLog, endCallLog } from '../utils/callLogger';

interface AuthenticatedSocket extends Socket {
    userId?: string;
    externalId?: string;
}

interface CallInvitation {
    callerId: string;
    receiverId: string;
    callType: 'VIDEO' | 'AUDIO';
}

interface ActiveCall {
    callLogId: string;
    callerId: string;
    receiverId: string;
    startTime: Date;
}

// In-memory storage for active connections and calls
const activeConnections = new Map<string, string>(); // internalId -> socketId
const activeCalls = new Map<string, ActiveCall>(); // callLogId -> ActiveCall

export function setupSocket(server: HttpServer) {
    const io = new SocketIOServer(server, {
        cors: {
            origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    // Authentication middleware
    io.use(async (socket: AuthenticatedSocket, next) => {
        try {
            const externalId = socket.handshake.auth.externalId;

            if (!externalId) {
                return next(new Error('Authentication failed: externalId required'));
            }

            const internalId = await mapExternalIdToInternal(externalId);
            if (!internalId) {
                return next(new Error('Authentication failed: User not found'));
            }

            socket.userId = internalId;
            socket.externalId = externalId;

            console.info(`User authenticated: ${externalId} -> ${internalId}`);
            next();
        } catch (error) {
            console.error('Authentication error:', error);
            next(new Error('Authentication failed'));
        }
    });

    io.on('connection', (socket: AuthenticatedSocket) => {
        if (!socket.userId) return;

        // Store active connection
        activeConnections.set(socket.userId, socket.id);
        console.info(`User connected: ${socket.externalId} (${socket.userId})`);

        // Join user to their personal room
        socket.join(`user:${socket.userId}`);

        // Handle call invitation
        socket.on('call:invite', async (data: CallInvitation) => {
            try {
                const { receiverId: receiverExternalId, callType } = data;

                // Map receiver's external ID to internal ID
                const receiverInternalId = await mapExternalIdToInternal(receiverExternalId);
                if (!receiverInternalId) {
                    socket.emit('call:error', { message: 'Receiver not found' });
                    return;
                }

                // Check if receiver is online
                const receiverSocketId = activeConnections.get(receiverInternalId);
                if (!receiverSocketId) {
                    socket.emit('call:error', { message: 'Receiver is offline' });
                    return;
                }

                // Create call log
                const callLog = await createCallLog(socket.userId!, receiverInternalId, callType as 'video' | 'voice');

                // Store active call
                activeCalls.set(callLog.id, {
                    callLogId: callLog.id,
                    callerId: socket.userId!,
                    receiverId: receiverInternalId,
                    startTime: new Date()
                });

                // Send invitation to receiver
                io.to(receiverSocketId).emit('call:incoming', {
                    callLogId: callLog.id,
                    callerExternalId: socket.externalId,
                    callType,
                    timestamp: new Date().toISOString()
                });

                // Confirm invitation sent to caller
                socket.emit('call:invitation-sent', {
                    callLogId: callLog.id,
                    receiverExternalId,
                    timestamp: new Date().toISOString()
                });

                console.info(`Call invitation sent: ${socket.externalId} -> ${receiverExternalId}`);
            } catch (error) {
                console.error('Call invitation error:', error);
                socket.emit('call:error', { message: 'Failed to send invitation' });
            }
        });

        // Handle call answer
        socket.on('call:answer', async (data: { callLogId: string; accepted: boolean }) => {
            try {
                const { callLogId, accepted } = data;
                const activeCall = activeCalls.get(callLogId);

                if (!activeCall) {
                    socket.emit('call:error', { message: 'Call not found' });
                    return;
                }

                const callerSocketId = activeConnections.get(activeCall.callerId);

                if (accepted) {
                    // Notify caller that call was accepted
                    if (callerSocketId) {
                        io.to(callerSocketId).emit('call:accepted', {
                            callLogId,
                            timestamp: new Date().toISOString()
                        });
                    }

                    // Both users join the call room
                    socket.join(`call:${callLogId}`);
                    if (callerSocketId) {
                        io.sockets.sockets.get(callerSocketId)?.join(`call:${callLogId}`);
                    }

                    console.info(`Call accepted: ${callLogId}`);
                } else {
                    // Call was rejected
                    if (callerSocketId) {
                        io.to(callerSocketId).emit('call:rejected', {
                            callLogId,
                            timestamp: new Date().toISOString()
                        });
                    }

                    // End call log
                    await endCallLog(callLogId);
                    activeCalls.delete(callLogId);

                    console.info(`Call rejected: ${callLogId}`);
                }
            } catch (error) {
                console.error('Call answer error:', error);
                socket.emit('call:error', { message: 'Failed to process answer' });
            }
        });

        // Handle call end
        socket.on('call:end', async (data: { callLogId: string }) => {
            try {
                const { callLogId } = data;
                const activeCall = activeCalls.get(callLogId);

                if (!activeCall) {
                    socket.emit('call:error', { message: 'Call not found' });
                    return;
                }

                // Notify all participants that call ended
                io.to(`call:${callLogId}`).emit('call:ended', {
                    callLogId,
                    timestamp: new Date().toISOString()
                });

                // End call log
                await endCallLog(callLogId);
                activeCalls.delete(callLogId);

                console.info(`Call ended: ${callLogId}`);
            } catch (error) {
                console.error('Call end error:', error);
                socket.emit('call:error', { message: 'Failed to end call' });
            }
        });

        // Handle Mediasoup events
        handleMediasoupEvents(socket, io);

        // Handle disconnection
        socket.on('disconnect', async (reason) => {
            if (!socket.userId) return;

            console.info(`User disconnected: ${socket.externalId} (${reason})`);

            // Remove from active connections
            activeConnections.delete(socket.userId);

            // End any active calls
            for (const [callLogId, activeCall] of activeCalls.entries()) {
                if (activeCall.callerId === socket.userId || activeCall.receiverId === socket.userId) {
                    // Notify other participant
                    io.to(`call:${callLogId}`).emit('call:ended', {
                        callLogId,
                        reason: 'participant_disconnected',
                        timestamp: new Date().toISOString()
                    });

                    // End call log
                    await endCallLog(callLogId);
                    activeCalls.delete(callLogId);
                }
            }
        });
    });

    return io;
}

export function getActiveConnections() {
    return Array.from(activeConnections.entries());
}

export function getActiveCalls() {
    return Array.from(activeCalls.entries());
}