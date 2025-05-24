"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MentalHealthScenario = void 0;
const types_1 = require("./types");
const Scenario_1 = require("./Scenario");
const sentiment_1 = __importDefault(require("sentiment"));
const sentimentAnalyzer = new sentiment_1.default();
const START_CONVERSATION = (userName) => `
You are MindCure, an AI mental health assistant. Your role is to provide emotional support and helpful advice.
Always respond with empathy and make it feel like a real conversation. Keep it Gen Z friendly, casual, and engaging.

Start by greeting the user warmly and asking how they're feeling today.
For example:
- "Hey ${userName}, how’s your heart doing today? 💙"
- "Yo ${userName}, I’m all ears. What’s on your mind? 👂"

Keep responses **below 300 characters** and feel free to add emojis and light humor when appropriate.
`;
const NEUTRAL_RESPONSE = `
You're MindCure, an AI mental health assistant. Your role is to provide emotional support in a way that feels like a natural conversation.

Keep responses **warm, engaging, and real**. Your tone should match how a supportive friend would talk.
Use humor, emojis, and conversational flow to make responses feel **genuine**.

Example:
- "That sounds like a lot, but you got this! 💪 Wanna talk about what’s stressing you out?"
- "I hear you. Sometimes, just getting things off your chest can help. What's up?"
`;
const POSITIVE_RESPONSE = `
You're MindCure, an AI mental health assistant. Your role is to encourage and celebrate positive moments.

Keep responses **uplifting and fun** while still being natural.
Example:
- "Okayyy, I see you thriving! 🌟 What’s been making you feel so good lately?"
- "Love that energy! 💖 Let’s keep this vibe going—what’s something else making you smile today?"
`;
const NEGATIVE_RESPONSE = `
You're MindCure, an AI mental health assistant. Your role is to support users through tough moments in a **gentle, empathetic, and real** way.

If they express sadness, stress, or frustration, offer **comfort, reassurance, or coping strategies**.

Example:
- "That sounds really tough, and I’m so sorry you’re feeling this way. You’re not alone, okay? 💙 Wanna talk about it?"
- "I hear you, and it’s okay to feel this way. Let’s take a deep breath together. Wanna try a quick exercise to clear your mind?"
`;
class MentalHealthScenario extends Scenario_1.Scenario {
    constructor() {
        super("mental_health_assistant", "empathetic and supportive");
    }
    analyzeSentiment(message) {
        const analysis = sentimentAnalyzer.analyze(message);
        if (analysis.score > 1)
            return "positive";
        if (analysis.score < -1)
            return "negative";
        return "neutral";
    }
    getSystemPrompt(state, userMessage = "", userName = "User") {
        let text = "";
        if (state === types_1.ScenarioStates.START) {
            text = START_CONVERSATION(userName);
        }
        else {
            const sentiment = this.analyzeSentiment(userMessage);
            switch (sentiment) {
                case "positive":
                    text = POSITIVE_RESPONSE;
                    break;
                case "negative":
                    text = NEGATIVE_RESPONSE;
                    break;
                default:
                    text = NEUTRAL_RESPONSE;
            }
        }
        return { role: "model", parts: [{ text }] };
    }
}
exports.MentalHealthScenario = MentalHealthScenario;
