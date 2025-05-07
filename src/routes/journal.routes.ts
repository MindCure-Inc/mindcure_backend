import express from "express";
import {
    createJournalEntry,
    getMyJournalEntries,
    getSingleJournalEntry,
    updateJournalEntry,
    deleteJournalEntry
} from "../controllers/journal.controller";

const router = express.Router();

router.post("/", createJournalEntry);
router.get("/", getMyJournalEntries);
router.get("/:id", getSingleJournalEntry);
router.put("/:id", updateJournalEntry);
router.delete("/:id", deleteJournalEntry);

export default router;
