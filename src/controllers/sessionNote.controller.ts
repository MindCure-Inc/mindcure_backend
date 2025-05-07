import { Request, Response } from 'express';
import { prisma } from "../lib/prisma";

export const createNote = async (req: Request, res: Response) => {
    try {
        const therapistProfileId = (req as any).therapistProfileId; // set by verifyTherapist
        const { sessionId, content } = req.body;

        const session = await prisma.session.findUnique({
            where: { id: sessionId },
        });

        if (!session || session.therapistId !== therapistProfileId) {
            res.status(403).json({ error: "Not authorized to add notes to this session" });
            return
        }

        const note = await prisma.sessionNote.create({
            data: {
                sessionId,
                content,
            },
        });

        res.status(201).json(note);
    } catch (err) {
        console.error("createNote error:", err);
        res.status(500).json({ error: "Failed to create note" });
    }
};

export const getNote = async (req: Request, res: Response) => {
    try {
        const therapistId = (req as any).therapistProfileId; 
        const { sessionId } = req.params; 

        // Fetch the session to check if the therapist is authorized
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
        });

        if (!session || session.therapistId !== therapistId) {
            res.status(403).json({ error: "Not authorized to view notes for this session" });
            return
        }

        // Fetch the note for the session
        const note = await prisma.sessionNote.findUnique({
            where: { sessionId },
        });

        if (!note) {
            res.status(404).json({ error: "No note found for this session" });
            return
        }

        res.status(200).json(note);
    } catch (err) {
        console.error("getNote error:", err);
        res.status(500).json({ error: "Failed to fetch note" });
    }
};

export const updateNote = async (req: Request, res: Response) => {
    try {
        const therapistId = (req as any).therapistProfileId; 
        const { sessionId, content } = req.body;

        const session = await prisma.session.findUnique({
            where: { id: sessionId },
        });

        if (!session || session.therapistId !== therapistId) {
            res.status(403).json({ error: "Not authorized to update notes for this session" });
            return
        }

        // Fetch and update the session note
        const note = await prisma.sessionNote.update({
            where: { sessionId },
            data: { content },
        });

        res.status(200).json(note);
    } catch (err) {
        console.error("updateNote error:", err);
        res.status(500).json({ error: "Failed to update note" });
    }
};

export const deleteNote = async (req: Request, res: Response) => {
    try {
        const therapistId = (req as any).therapistProfileId; // set by verifyTherapist
        const { sessionId } = req.params;

        // Fetch the session to check if the therapist is authorized
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
        });

        if (!session || session.therapistId !== therapistId) {
            res.status(403).json({ error: "Not authorized to delete notes for this session" });
            return
        }

        // Delete the session note
        await prisma.sessionNote.delete({
            where: { sessionId },
        });

        res.status(200).json({ message: "Note deleted successfully" });
    } catch (err) {
        console.error("deleteNote error:", err);
        res.status(500).json({ error: "Failed to delete note" });
    }
};
