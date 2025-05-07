import { Router } from "express";
import { createEmotion, getEmotions, deleteEmotion } from "../controllers/emotion.controller";
import { requireAuth } from "@clerk/express";

const router = Router();

router.post("/", requireAuth(), createEmotion);
router.get("/", requireAuth(), getEmotions);
router.delete("/:id", requireAuth(), deleteEmotion);

export default router;
