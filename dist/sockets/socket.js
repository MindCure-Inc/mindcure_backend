"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocket = setupSocket;
exports.getActiveConnections = getActiveConnections;
exports.getActiveCalls = getActiveCalls;
const socket_io_1 = require("socket.io");
const idMapper_1 = require("../utils/idMapper");
const handlers_1 = require("../mediasoup/handlers");
const callLogger_1 = require("../utils/callLogger");
// In-memory storage for active connections and calls
const activeConnections = new Map(); // internalId -> socketId
const activeCalls = new Map(); // callLogId -> ActiveCall
function setupSocket(server) {
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true
        }
    });
    // Authentication middleware
    io.use((socket, next) => __awaiter(this, void 0, void 0, function* () {
        try {
            const externalId = socket.handshake.auth.externalId;
            if (!externalId) {
                return next(new Error('Authentication failed: externalId required'));
            }
            const internalId = yield (0, idMapper_1.mapExternalIdToInternal)(externalId);
            if (!internalId) {
                return next(new Error('Authentication failed: User not found'));
            }
            socket.userId = internalId;
            socket.externalId = externalId;
            console.info(`User authenticated: ${externalId} -> ${internalId}`);
            next();
        }
        catch (error) {
            console.error('Authentication error:', error);
            next(new Error('Authentication failed'));
        }
    }));
    io.on('connection', (socket) => {
        if (!socket.userId)
            return;
        // Store active connection
        activeConnections.set(socket.userId, socket.id);
        console.info(`User connected: ${socket.externalId} (${socket.userId})`);
        // Join user to their personal room
        socket.join(`user:${socket.userId}`);
        // Handle call invitation
        socket.on('call:invite', (data) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { receiverId: receiverExternalId, callType } = data;
                // Map receiver's external ID to internal ID
                const receiverInternalId = yield (0, idMapper_1.mapExternalIdToInternal)(receiverExternalId);
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
                const callLog = yield (0, callLogger_1.createCallLog)(socket.userId, receiverInternalId, callType);
                // Store active call
                activeCalls.set(callLog.id, {
                    callLogId: callLog.id,
                    callerId: socket.userId,
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
            }
            catch (error) {
                console.error('Call invitation error:', error);
                socket.emit('call:error', { message: 'Failed to send invitation' });
            }
        }));
        // Handle call answer
        socket.on('call:answer', (data) => __awaiter(this, void 0, void 0, function* () {
            var _a;
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
                        (_a = io.sockets.sockets.get(callerSocketId)) === null || _a === void 0 ? void 0 : _a.join(`call:${callLogId}`);
                    }
                    console.info(`Call accepted: ${callLogId}`);
                }
                else {
                    // Call was rejected
                    if (callerSocketId) {
                        io.to(callerSocketId).emit('call:rejected', {
                            callLogId,
                            timestamp: new Date().toISOString()
                        });
                    }
                    // End call log
                    yield (0, callLogger_1.endCallLog)(callLogId);
                    activeCalls.delete(callLogId);
                    console.info(`Call rejected: ${callLogId}`);
                }
            }
            catch (error) {
                console.error('Call answer error:', error);
                socket.emit('call:error', { message: 'Failed to process answer' });
            }
        }));
        // Handle call end
        socket.on('call:end', (data) => __awaiter(this, void 0, void 0, function* () {
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
                yield (0, callLogger_1.endCallLog)(callLogId);
                activeCalls.delete(callLogId);
                console.info(`Call ended: ${callLogId}`);
            }
            catch (error) {
                console.error('Call end error:', error);
                socket.emit('call:error', { message: 'Failed to end call' });
            }
        }));
        // Handle Mediasoup events
        (0, handlers_1.handleMediasoupEvents)(socket, io);
        // Handle disconnection
        socket.on('disconnect', (reason) => __awaiter(this, void 0, void 0, function* () {
            if (!socket.userId)
                return;
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
                    yield (0, callLogger_1.endCallLog)(callLogId);
                    activeCalls.delete(callLogId);
                }
            }
        }));
    });
    return io;
}
function getActiveConnections() {
    return Array.from(activeConnections.entries());
}
function getActiveCalls() {
    return Array.from(activeCalls.entries());
}
