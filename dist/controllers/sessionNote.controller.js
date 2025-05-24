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
exports.deleteNote = exports.updateNote = exports.getNote = exports.createNote = void 0;
const prisma_1 = require("../lib/prisma");
const createNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const therapistProfileId = req.therapistProfileId; // set by verifyTherapist
        const { sessionId, content } = req.body;
        const session = yield prisma_1.prisma.session.findUnique({
            where: { id: sessionId },
        });
        if (!session || session.therapistId !== therapistProfileId) {
            res.status(403).json({ error: "Not authorized to add notes to this session" });
            return;
        }
        const note = yield prisma_1.prisma.sessionNote.create({
            data: {
                sessionId,
                content,
            },
        });
        res.status(201).json(note);
    }
    catch (err) {
        console.error("createNote error:", err);
        res.status(500).json({ error: "Failed to create note" });
    }
});
exports.createNote = createNote;
const getNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const therapistId = req.therapistProfileId;
        const { sessionId } = req.params;
        // Fetch the session to check if the therapist is authorized
        const session = yield prisma_1.prisma.session.findUnique({
            where: { id: sessionId },
        });
        if (!session || session.therapistId !== therapistId) {
            res.status(403).json({ error: "Not authorized to view notes for this session" });
            return;
        }
        // Fetch the note for the session
        const note = yield prisma_1.prisma.sessionNote.findUnique({
            where: { sessionId },
        });
        if (!note) {
            res.status(404).json({ error: "No note found for this session" });
            return;
        }
        res.status(200).json(note);
    }
    catch (err) {
        console.error("getNote error:", err);
        res.status(500).json({ error: "Failed to fetch note" });
    }
});
exports.getNote = getNote;
const updateNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const therapistId = req.therapistProfileId;
        const { sessionId, content } = req.body;
        const session = yield prisma_1.prisma.session.findUnique({
            where: { id: sessionId },
        });
        if (!session || session.therapistId !== therapistId) {
            res.status(403).json({ error: "Not authorized to update notes for this session" });
            return;
        }
        // Fetch and update the session note
        const note = yield prisma_1.prisma.sessionNote.update({
            where: { sessionId },
            data: { content },
        });
        res.status(200).json(note);
    }
    catch (err) {
        console.error("updateNote error:", err);
        res.status(500).json({ error: "Failed to update note" });
    }
});
exports.updateNote = updateNote;
const deleteNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const therapistId = req.therapistProfileId; // set by verifyTherapist
        const { sessionId } = req.params;
        // Fetch the session to check if the therapist is authorized
        const session = yield prisma_1.prisma.session.findUnique({
            where: { id: sessionId },
        });
        if (!session || session.therapistId !== therapistId) {
            res.status(403).json({ error: "Not authorized to delete notes for this session" });
            return;
        }
        // Delete the session note
        yield prisma_1.prisma.sessionNote.delete({
            where: { sessionId },
        });
        res.status(200).json({ message: "Note deleted successfully" });
    }
    catch (err) {
        console.error("deleteNote error:", err);
        res.status(500).json({ error: "Failed to delete note" });
    }
});
exports.deleteNote = deleteNote;
