import express from "express";
import { bookSession, updateSession, cancelSession, getSessions , getSessionById } from "../controllers/appointments.controller";
import {requireAuth} from "@clerk/express";

const router = express.Router();

router.post('/book', requireAuth(), bookSession);
router.put('/update/:id', requireAuth(), updateSession);
router.delete('/cancel/:id', requireAuth(), cancelSession);
router.get('/sessions', requireAuth(), getSessions);
router.get('/session/:id', requireAuth(), getSessionById);

export default router;