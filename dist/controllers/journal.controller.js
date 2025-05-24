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
exports.deleteJournalEntry = exports.updateJournalEntry = exports.getSingleJournalEntry = exports.getMyJournalEntries = exports.createJournalEntry = void 0;
const express_1 = require("@clerk/express");
const prisma_1 = require("../lib/prisma");
const createUser_1 = require("../utils/createUser");
// Helper to get internal patientId from Clerk userId
function getPatientIdFromClerkUserId(clerkUserId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!clerkUserId)
            return null;
        const profile = yield prisma_1.prisma.profile.findUnique({
            where: { externalId: clerkUserId },
        });
        return (profile === null || profile === void 0 ? void 0 : profile.id) || null;
    });
}
const createJournalEntry = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const clerkUserId = (_a = req.auth) === null || _a === void 0 ? void 0 : _a.userId;
    if (!clerkUserId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const patientId = yield getPatientIdFromClerkUserId(clerkUserId);
    if (!patientId) {
        res.status(404).json({ error: "User profile not found" });
        return;
    }
    try {
        const user = yield (0, createUser_1.createOrGetUser)(clerkUserId);
        const { title, content, mood, tags = [], sharedWithTherapist = false, therapistId } = req.body;
        const entry = yield prisma_1.prisma.journalEntry.create({
            data: {
                patientId,
                title,
                content,
                mood,
                tags,
                sharedWithTherapist,
                therapistId: sharedWithTherapist ? therapistId : null,
            },
        });
        res.status(201).json(entry);
    }
    catch (error) {
        console.error("Create Journal Error:", error.message);
        res.status(500).json({ error: "Failed to create journal entry" });
    }
});
exports.createJournalEntry = createJournalEntry;
const getMyJournalEntries = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const clerkUserId = (0, express_1.getAuth)(req).userId;
    if (!clerkUserId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const patientId = yield getPatientIdFromClerkUserId(clerkUserId);
    if (!patientId) {
        res.status(404).json({ error: "User profile not found" });
        return;
    }
    try {
        const entries = yield prisma_1.prisma.journalEntry.findMany({
            where: {
                patientId,
                deletedAt: null,
            },
            orderBy: { createdAt: "desc" },
        });
        res.json(entries);
    }
    catch (error) {
        console.error("Fetch Journals Error:", error.message);
        res.status(500).json({ error: "Failed to fetch journal entries" });
    }
});
exports.getMyJournalEntries = getMyJournalEntries;
const getSingleJournalEntry = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const clerkUserId = (0, express_1.getAuth)(req).userId;
    const { id } = req.params;
    if (!clerkUserId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const patientId = yield getPatientIdFromClerkUserId(clerkUserId);
    if (!patientId) {
        res.status(404).json({ error: "User profile not found" });
        return;
    }
    try {
        const entry = yield prisma_1.prisma.journalEntry.findFirst({
            where: {
                id,
                patientId,
                deletedAt: null,
            },
        });
        if (!entry) {
            res.status(404).json({ error: "Journal entry not found" });
            return;
        }
        res.json(entry);
    }
    catch (error) {
        console.error("Get Entry Error:", error.message);
        res.status(500).json({ error: "Failed to fetch entry" });
    }
});
exports.getSingleJournalEntry = getSingleJournalEntry;
const updateJournalEntry = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const clerkUserId = (0, express_1.getAuth)(req).userId;
    const { id } = req.params;
    if (!clerkUserId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const patientId = yield getPatientIdFromClerkUserId(clerkUserId);
    if (!patientId) {
        res.status(404).json({ error: "User profile not found" });
        return;
    }
    try {
        const existing = yield prisma_1.prisma.journalEntry.findFirst({
            where: { id, patientId },
        });
        if (!existing) {
            res.status(404).json({ error: "Entry not found" });
            return;
        }
        const { title, content, mood, tags, sharedWithTherapist, therapistId } = req.body;
        const updated = yield prisma_1.prisma.journalEntry.update({
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
    }
    catch (error) {
        console.error("Update Entry Error:", error.message);
        res.status(500).json({ error: "Failed to update journal entry" });
    }
});
exports.updateJournalEntry = updateJournalEntry;
const deleteJournalEntry = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const clerkUserId = (0, express_1.getAuth)(req).userId;
    const { id } = req.params;
    if (!clerkUserId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const patientId = yield getPatientIdFromClerkUserId(clerkUserId);
    if (!patientId) {
        res.status(404).json({ error: "User profile not found" });
        return;
    }
    try {
        yield prisma_1.prisma.journalEntry.updateMany({
            where: { id, patientId },
            data: { deletedAt: new Date() },
        });
        res.json({ success: true });
    }
    catch (error) {
        console.error("Delete Entry Error:", error.message);
        res.status(500).json({ error: "Failed to delete journal entry" });
    }
});
exports.deleteJournalEntry = deleteJournalEntry;
