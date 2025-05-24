"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const chatbot_controller_1 = require("../controllers/chatbot.controller");
const express_2 = require("@clerk/express");
const router = express_1.default.Router();
router.post('/chatbot', (0, express_2.requireAuth)(), chatbot_controller_1.chatbotController);
exports.default = router;
