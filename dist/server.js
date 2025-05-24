"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app")); // your Express app
const socket_io_1 = require("socket.io");
const mediasoup_1 = require("./sockets/mediasoup");
const chat_1 = require("./sockets/chat");
const logger_1 = require("./utils/logger");
dotenv_1.default.config();
const port = process.env.PORT || 3000;
const server = http_1.default.createServer(app_1.default);
// Setup Socket.IO
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*', // 🔥 Change this to your frontend origin in prod for security
        methods: ['GET', 'POST'],
    },
});
(0, mediasoup_1.registerMediasoupHandlers)(io);
(0, chat_1.registerChatHandlers)(io);
server.listen(port, () => {
    logger_1.Logger.info(`🚀 MindCure backend running on http://localhost:${port}`);
});
//TODO:Implement video calling and signaling using mediasoup
