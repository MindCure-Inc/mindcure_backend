import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { prisma } from "../lib/prisma";
import { MoodType } from "@prisma/client";

// CREATE
export const createEmotion = async (req: Request, res: Response) => {
    const { userId } = getAuth(req);
    const { emotion } = req.body;

    if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }

    if (!emotion || !Object.values(MoodType).includes(emotion)) {
        res.status(400).json({ error: "Invalid or missing emotion" });
        return;
    }

    try {
        const created = await prisma.emotionTracking.create({
            data: {
                userId,
                emotion,
            },
        });

        res.status(201).json(created);
    } catch (error) {
        console.error("createEmotion error:", error);
        res.status(500).json({ error: "Failed to create emotion entry" });
    }
};

// GET ALL
export const getEmotions = async (req: Request, res: Response) => {
    const { userId } = getAuth(req);

    if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }

    try {
        const emotions = await prisma.emotionTracking.findMany({
            where: {
                userId,
                deletedAt: null,
            },
            orderBy: {
                detectedAt: "desc",
            },
        });

        res.json(emotions);
    } catch (error) {
        console.error("getEmotions error:", error);
        res.status(500).json({ error: "Failed to fetch emotions" });
    }
};

// DELETE (soft)
export const deleteEmotion = async (req: Request, res: Response) => {
    const { userId } = getAuth(req);
    const { id } = req.params;

    if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }

    try {
        const entry = await prisma.emotionTracking.updateMany({
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
    } catch (error) {
        console.error("deleteEmotion error:", error);
        res.status(500).json({ error: "Failed to delete emotion" });
    }
};
//TODO:To add gemini-powered emotion detection
//TODO: Add weekly emotion chart api and emotion streak traker