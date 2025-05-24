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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveMessage = saveMessage;
exports.getMessagesForUser = getMessagesForUser;
exports.saveGroupMessage = saveGroupMessage;
exports.getGroupMessages = getGroupMessages;
const ioredis_1 = __importDefault(require("ioredis"));
const redis = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379');
function saveMessage(from, to, content) {
    return __awaiter(this, void 0, void 0, function* () {
        const key = `chat:${[from, to].sort().join(':')}`;
        const message = JSON.stringify({ from, to, content, timestamp: Date.now() });
        yield redis.rpush(key, message);
    });
}
function getMessagesForUser(userA, userB) {
    return __awaiter(this, void 0, void 0, function* () {
        const key = `chat:${[userA, userB].sort().join(':')}`;
        const messages = yield redis.lrange(key, 0, -1);
        return messages.map((msg) => JSON.parse(msg));
    });
}
function saveGroupMessage(groupId, from, content) {
    return __awaiter(this, void 0, void 0, function* () {
        const key = `groupchat:${groupId}`;
        const message = JSON.stringify({ from, content, timestamp: Date.now() });
        yield redis.rpush(key, message);
    });
}
function getGroupMessages(groupId) {
    return __awaiter(this, void 0, void 0, function* () {
        const key = `groupchat:${groupId}`;
        const messages = yield redis.lrange(key, 0, -1);
        return messages.map((msg) => JSON.parse(msg));
    });
}
