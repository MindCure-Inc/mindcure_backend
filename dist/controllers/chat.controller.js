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
exports.getGroupMessagesController = exports.getPrivateMessages = void 0;
const redisService_1 = require("../services/redisService");
const getPrivateMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userA, userB } = req.params;
    if (!userA || !userB)
        return res.status(400).json({ error: 'Missing user IDs' });
    try {
        const messages = yield (0, redisService_1.getMessagesForUser)(userA, userB);
        res.json(messages);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});
exports.getPrivateMessages = getPrivateMessages;
const getGroupMessagesController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { groupId } = req.params;
    if (!groupId)
        return res.status(400).json({ error: 'Missing groupId' });
    try {
        const messages = yield (0, redisService_1.getGroupMessages)(groupId);
        res.json(messages);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch group messages' });
    }
});
exports.getGroupMessagesController = getGroupMessagesController;
