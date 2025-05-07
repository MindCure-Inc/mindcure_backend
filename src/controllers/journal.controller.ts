import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { prisma } from "../lib/prisma";
import { createOrGetUser } from "../utils/createUser";

export const createJournalEntry = async (req: Request, res: Response) => {
    const { userId } = getAuth(req);
    if (!userId)  {
        res.status(401).json({ error: "Unauthorized" });
        return
    }

    try {
        const user = await createOrGetUser(userId);

        const { title, content, mood, tags = [], sharedWithTherapist = false, therapistId } = req.body;

        const entry = await prisma.journalEntry.create({
            data: {
                patientId: userId,
                title,
                content,
                mood,
                tags,
                sharedWithTherapist,
                therapistId: sharedWithTherapist ? therapistId : null,
            },
        });

        res.status(201).json(entry);
    } catch (error: any) {
        console.error("Create Journal Error:", error.message);
        res.status(500).json({ error: "Failed to create journal entry" });
    }
};

export const getMyJournalEntries = async (req: Request, res: Response) => {
    const { userId } = getAuth(req);
    if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return
    }

    try {
        const entries = await prisma.journalEntry.findMany({
            where: {
                patientId: userId,
                deletedAt: null,
            },
            orderBy: { createdAt: "desc" },
        });

        res.json(entries);
    } catch (error: any) {
        console.error("Fetch Journals Error:", error.message);
        res.status(500).json({ error: "Failed to fetch journal entries" });
    }
};

export const getSingleJournalEntry = async (req: Request, res: Response) => {
    const { userId } = getAuth(req);
    const { id } = req.params;
    if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return
    } 

    try {
        const entry = await prisma.journalEntry.findFirst({
            where: {
                id,
                patientId: userId,
                deletedAt: null,
            },
        });

        if (!entry)  {
            res.status(404).json({ error: "Journal entry not found" });
            return
        }

        res.json(entry);
    } catch (error: any) {
        console.error("Get Entry Error:", error.message);
        res.status(500).json({ error: "Failed to fetch entry" });
    }
};

export const updateJournalEntry = async (req: Request, res: Response) => {
    const { userId } = getAuth(req);
    const { id } = req.params;
    if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return
    } 

    try {
        const existing = await prisma.journalEntry.findFirst({
            where: { id, patientId: userId },
        });

        if (!existing) {
            res.status(404).json({ error: "Entry not found" });
            return
        }

        const { title, content, mood, tags, sharedWithTherapist, therapistId } = req.body;

        const updated = await prisma.journalEntry.update({
            where: { id },
            data: {
                title,
                content,
                mood,
                tags,
                sharedWithTherapist,
                therapistId: sharedWithTherapist ? therapistId : null,
            },
        });

        res.json(updated);
    } catch (error: any) {
        console.error("Update Entry Error:", error.message);
        res.status(500).json({ error: "Failed to update journal entry" });
    }
};

export const deleteJournalEntry = async (req: Request, res: Response) => {
    const { userId } = getAuth(req);
    const { id } = req.params;
    if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return
    } 

    try {
        await prisma.journalEntry.updateMany({
            where: { id, patientId: userId },
            data: { deletedAt: new Date() },
        });

        res.json({ success: true });
    } catch (error: any) {
        console.error("Delete Entry Error:", error.message);
        res.status(500).json({ error: "Failed to delete journal entry" });
    }
};
