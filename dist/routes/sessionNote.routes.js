"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sessionNote_controller_1 = require("../controllers/sessionNote.controller");
const verifyTherapist_1 = require("../middleware/verifyTherapist");
const router = (0, express_1.Router)();
// Route to create a session note
router.post("/", verifyTherapist_1.verifyTherapist, sessionNote_controller_1.createNote);
// Route to get a session note
router.get("/:sessionId", verifyTherapist_1.verifyTherapist, sessionNote_controller_1.getNote);
// Route to update a session note
router.put("/:sessionId", verifyTherapist_1.verifyTherapist, sessionNote_controller_1.updateNote);
// Route to delete a session note
router.delete("/:sessionId", verifyTherapist_1.verifyTherapist, sessionNote_controller_1.deleteNote);
exports.default = router;
