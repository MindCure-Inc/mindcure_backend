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
exports.chatbotController = void 0;
const express_1 = require("@clerk/express");
const axios_1 = __importDefault(require("axios"));
const prisma_1 = require("../lib/prisma");
const MentalHealthScenario_1 = require("../utils/MentalHealthScenario");
const types_1 = require("../utils/types");
const createUser_1 = require("../utils/createUser");
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not defined');
}
const chatbotController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g;
    const { userId } = (0, express_1.getAuth)(req);
    if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    try {
        const user = yield (0, createUser_1.createOrGetUser)(userId);
        const { firstName, message, history = [] } = req.body;
        if (!message)
            res.status(400).json({ error: 'Message is required' });
        const userName = firstName || 'Buddy';
        const mentalHealthScenario = new MentalHealthScenario_1.MentalHealthScenario();
        const sentiment = mentalHealthScenario.analyzeSentiment(message);
        const systemPrompt = mentalHealthScenario.getSystemPrompt(history.length === 0 ? types_1.ScenarioStates.START : types_1.ScenarioStates.CONTINUE, message, userName);
        const chatHistory = history.map((msg) => ({
            role: msg.role === "assistant" ? "model" : msg.role,
            parts: [{ text: msg.content }],
        }));
        const requestBody = {
            contents: [
                systemPrompt,
                ...chatHistory,
                { role: 'user', parts: [{ text: message }] },
            ],
        };
        const response = yield axios_1.default.post(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, requestBody, { headers: { 'Content-Type': 'application/json' } });
        const botResponse = (_f = (_e = (_d = (_c = (_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.candidates) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.content) === null || _d === void 0 ? void 0 : _d.parts) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.text;
        if (!botResponse) {
            console.error('Chatbot API returned an empty response:', response.data);
            res.status(500).json({ error: 'Chatbot could not generate a response' });
            return;
        }
        yield prisma_1.prisma.aIChat.create({
            data: {
                userId: user.id,
                modelName: "MindCure-Gemini",
                message,
                response: botResponse,
            },
        });
        res.json({ reply: botResponse });
    }
    catch (error) {
        console.error('Chatbot Error:', ((_g = error.response) === null || _g === void 0 ? void 0 : _g.data) || error.message);
        res.status(500).json({ error: 'Chatbot failed to respond' });
    }
});
exports.chatbotController = chatbotController;
//TODO: Add an emergency response hotline direct to the chatbot.
