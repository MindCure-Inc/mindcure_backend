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
exports.registerChatHandlers = registerChatHandlers;
const redisService_1 = require("../services/redisService");
function registerChatHandlers(io) {
    io.on('connection', (socket) => {
        // One-to-one messaging
        socket.on('private-message', (_a) => __awaiter(this, [_a], void 0, function* ({ from, to, content }) {
            yield (0, redisService_1.saveMessage)(from, to, content);
            io.to(to).emit('private-message', { from, content });
        }));
        // Group messaging
        socket.on('group-message', (_a) => __awaiter(this, [_a], void 0, function* ({ groupId, from, content }) {
            yield (0, redisService_1.saveGroupMessage)(groupId, from, content);
            io.to(groupId).emit('group-message', { from, content });
        }));
        // Join/leave group rooms
        socket.on('join-group', ({ groupId }) => {
            socket.join(groupId);
        });
        socket.on('leave-group', ({ groupId }) => {
            socket.leave(groupId);
        });
    });
}
