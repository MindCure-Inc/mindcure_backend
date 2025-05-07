import express from "express";
import {chatbotController} from "../controllers/chatbot.controller";
import {requireAuth} from "@clerk/express";

const router = express.Router();

router.post('/chatbot', requireAuth(), chatbotController);

export default router;