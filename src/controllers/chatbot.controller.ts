import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import axios from "axios";
import { prisma } from "../lib/prisma";
import { MentalHealthScenario } from "../utils/MentalHealthScenario";
import { ChatMessage, GeminiResponse, ScenarioStates } from "../utils/types";
import { createOrGetUser } from "../utils/createUser";

interface ChatRequestBody {
    firstName: string;
    message: string;
    history: ChatMessage[];
}

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not defined');
}

export const chatbotController = async (req: Request, res: Response) => {
    const { userId } = getAuth(req);

    if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }

    try {
        const user = await createOrGetUser(userId);

        const { firstName, message, history = [] } = req.body as ChatRequestBody;
        if (!message)  res.status(400).json({ error: 'Message is required' });

        const userName = firstName || 'Buddy';
        const mentalHealthScenario = new MentalHealthScenario();

        const sentiment = mentalHealthScenario.analyzeSentiment(message);
        const systemPrompt = mentalHealthScenario.getSystemPrompt(
            history.length === 0 ? ScenarioStates.START : ScenarioStates.CONTINUE,
            message,
            userName
        );

        const chatHistory = history.map((msg: ChatMessage) => ({
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

        const response = await axios.post<GeminiResponse>(
            `${GEMINI_URL}?key=${GEMINI_API_KEY}`,
            requestBody,
            { headers: { 'Content-Type': 'application/json' } }
        );

        const botResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!botResponse) {
            console.error('Chatbot API returned an empty response:', response.data);
            res.status(500).json({ error: 'Chatbot could not generate a response' });
            return;
        }

        await prisma.aIChat.create({
            data: {
                userId: user.id,
                modelName: "MindCure-Gemini",
                message,
                response: botResponse,
            },
        });

        res.json({ reply: botResponse });
    } catch (error: any) {
        console.error('Chatbot Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Chatbot failed to respond' });
    }
};
//TODO: Add an emergency response hotline direct to the chatbot.