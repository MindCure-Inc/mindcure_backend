"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const journal_controller_1 = require("../controllers/journal.controller");
const router = express_1.default.Router();
router.post("/", journal_controller_1.createJournalEntry);
router.get("/", journal_controller_1.getMyJournalEntries);
router.get("/:id", journal_controller_1.getSingleJournalEntry);
router.put("/:id", journal_controller_1.updateJournalEntry);
router.delete("/:id", journal_controller_1.deleteJournalEntry);
exports.default = router;
