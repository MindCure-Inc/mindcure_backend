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
exports.deleteEmotion = exports.getEmotions = exports.createEmotion = void 0;
const express_1 = require("@clerk/express");
const prisma_1 = require("../lib/prisma");
const prisma_2 = require("../generated/prisma");
// CREATE
const createEmotion = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = (0, express_1.getAuth)(req);
    const { emotion } = req.body;
    if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    if (!emotion || !Object.values(prisma_2.MoodType).includes(emotion)) {
        res.status(400).json({ error: "Invalid or missing emotion" });
        return;
    }
    try {
        const created = yield prisma_1.prisma.emotionTracking.create({
            data: {
                userId,
                emotion,
            },
        });
        res.status(201).json(created);
    }
    catch (error) {
        console.error("createEmotion error:", error);
        res.status(500).json({ error: "Failed to create emotion entry" });
    }
});
exports.createEmotion = createEmotion;
// GET ALL
const getEmotions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = (0, express_1.getAuth)(req);
    if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    try {
        const emotions = yield prisma_1.prisma.emotionTracking.findMany({
            where: {
                userId,
                deletedAt: null,
            },
            orderBy: {
                detectedAt: "desc",
            },
        });
        res.json(emotions);
    }
    catch (error) {
        console.error("getEmotions error:", error);
        res.status(500).json({ error: "Failed to fetch emotions" });
    }
});
exports.getEmotions = getEmotions;
// DELETE (soft)
const deleteEmotion = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = (0, express_1.getAuth)(req);
    const { id } = req.params;
    if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    try {
        const entry = yield prisma_1.prisma.emotionTracking.updateMany({
            where: {
                id,
                userId,
                deletedAt: null,
            },
            data: {
                deletedAt: new Date(),
            },
        });
        if (entry.count === 0) {
            res.status(404).json({ error: "Emotion entry not found or already deleted" });
            return;
        }
        res.json({ message: "Emotion entry deleted successfully" });
    }
    catch (error) {
        console.error("deleteEmotion error:", error);
        res.status(500).json({ error: "Failed to delete emotion" });
    }
});
exports.deleteEmotion = deleteEmotion;
//TODO:To add gemini-powered emotion detection
//TODO: Add weekly emotion chart api and emotion streak traker
