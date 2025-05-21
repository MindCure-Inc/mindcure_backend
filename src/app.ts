import express from 'express';
import { clerkMiddleware } from "@clerk/express";
import cors from 'cors';
import  dotenv from 'dotenv';
import chatbotRoutes from "./routes/chatbot.routes";
import appointmentsRoutes from "./routes/appointments.routes";
import paymentRoutes from "./routes/payment.routes";
import sessionNoteRoutes from "./routes/sessionNote.routes";
import journalRoutes from "./routes/journal.routes";
import emotionRoutes from "./routes/emotion.routes"
import walletRoutes from "./routes/wallet.routes"
import therapistRoutes from "./routes/therapist.routes"

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

//routes
app.use("/api", chatbotRoutes);
app.use("/api",appointmentsRoutes);
app.use("/api", paymentRoutes);
app.use("/api/notes",sessionNoteRoutes)
app.use("/api/journals",journalRoutes)
app.use("/api/emotions", emotionRoutes)
app.use("/api/wallet", walletRoutes)
app.use("/api",therapistRoutes)

export default app;