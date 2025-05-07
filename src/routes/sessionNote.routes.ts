import { Router } from "express";
import { createNote, getNote, updateNote, deleteNote } from "../controllers/sessionNote.controller";
import { verifyTherapist } from "../middleware/verifyTherapist";

const router = Router();

// Route to create a session note
router.post("/", verifyTherapist, createNote);

// Route to get a session note
router.get("/:sessionId", verifyTherapist, getNote);

// Route to update a session note
router.put("/:sessionId", verifyTherapist, updateNote);

// Route to delete a session note
router.delete("/:sessionId", verifyTherapist, deleteNote);

export default router;