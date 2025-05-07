import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { createOrGetUser } from "../utils/createUser";
import { Prisma } from "../generated/prisma";
import Decimal = Prisma.Decimal;
import flw from "../utils/flutterwave";

// Book a new session
export const bookSession = async (req: Request, res: Response) => {
    try {
        const { therapistId, patientId, scheduledAt, durationMinutes, type } = req.body;

        const patientProfile = await createOrGetUser(patientId);

        if (!patientProfile) {
            res.status(400).json({ error: "Invalid patient information." });
        }

        const conflictingSession = await prisma.session.findFirst({
            where: {
                therapistId,
                scheduledAt: new Date(scheduledAt),
                status: { notIn: ["cancelled"] },
            },
        });

        if (conflictingSession) {
            res.status(409).json({ error: "Therapist already has a session at this time." });
        }

        const session = await prisma.session.create({
            data: {
                therapistId,
                patientId: patientProfile.id,
                scheduledAt: new Date(scheduledAt),
                durationMinutes,
                type,
            },
        });

        res.status(201).json(session);
    } catch (error) {
        console.error("Error booking session:", error);
        res.status(500).json({ error: "Failed to book session" });
    }
};

// Update session status
export const updateSession = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const session = await prisma.session.findUnique({ where: { id } });
        if (!session) {
            res.status(404).json({ error: "Session not found" });
            return
        }

        if (status !== "completed") {
            // If not marking as completed, just update normally
            const updated = await prisma.session.update({
                where: { id },
                data: { status },
            });
            res.status(200).json(updated);
            return
        }

        const therapistDetail = await prisma.therapistDetail.findUnique({
            where: { profileId: session.therapistId },
        });

        if (!therapistDetail) {
            res.status(404).json({ error: "Therapist details not found." });
            return
        }

        const patientWallet = await prisma.wallet.findUnique({
            where: { userId: session.patientId },
        });

        const rate = therapistDetail.hourlyRate ?? new Decimal(0);
        const sessionCost = rate.mul(session.durationMinutes).div(60);

        if (!patientWallet) {
            res.status(404).json({ error: "Patient wallet not found." });
            return
        }

        if (patientWallet.balance.gte(sessionCost)) {
            // Patient can afford it, deduct & mark as completed
            const updatedWallet = await prisma.wallet.update({
                where: { userId: session.patientId },
                data: {
                    balance: patientWallet.balance.minus(sessionCost),
                },
            });

            const updatedSession = await prisma.session.update({
                where: { id },
                data: { status: "completed" },
            });

            res.status(200).json({
                message: "Session completed and wallet charged.",
                session: updatedSession,
                newBalance: updatedWallet.balance,
            });
        } else {
            // Not enough cash, initiate payment
            const tx_ref = `session-${session.id}-${Date.now()}`;

            const paymentPayload = {
                tx_ref,
                amount: sessionCost.toNumber(),
                currency: "NGN",
                redirect_url: "http://localhost:5000/payment/callback",
                customer: {
                    email: "user@email.com", // 👈 You should populate this from patient data
                },
            };

            const paymentResponse = await flw.Charge.create(paymentPayload);

            if (paymentResponse.status === "success") {
                await prisma.session.update({
                    where: { id: session.id },
                    data: {
                        status: "awaiting_payment",
                        txRef: tx_ref,
                    },
                });

                res.status(200).json({
                    message: "Insufficient wallet balance. Payment link generated.",
                    paymentUrl: paymentResponse.data.link,
                });
                return
            } else {
                res.status(400).json({ error: "Payment initiation failed." });
            }
        }
    } catch (error) {
        console.error("Error updating session:", error);
        res.status(500).json({ error: "Failed to update session" });
    }
};


// Cancel session
export const cancelSession = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const session = await prisma.session.update({
            where: { id },
            data: {
                status: "cancelled",
                deletedAt: new Date(),
            },
        });

        res.status(200).json({
            message: "Session cancelled successfully.",
            session,
        });
    } catch (error) {
        console.error("Error cancelling session:", error);
        res.status(500).json({ error: "Failed to cancel session" });
    }
};

// Get all sessions for a user
export const getSessions = async (req: Request, res: Response) => {
    try {
        const { userId } = req.query;

        const sessions = await prisma.session.findMany({
            where: {
                OR: [
                    { therapistId: String(userId) },
                    { patientId: String(userId) },
                ],
            },
            include: {
                therapist: true,
                patient: true,
            },
        });

        res.status(200).json(sessions);
    } catch (error) {
        console.error("Error fetching sessions:", error);
        res.status(500).json({ error: "Failed to fetch sessions" });
    }
};

// 👇 Get one session by ID
export const getSessionById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const session = await prisma.session.findUnique({
            where: { id },
            include: {
                therapist: true,
                patient: true,
            },
        });

        if (!session) {
            res.status(404).json({ error: "Session not found" });
        }

        res.status(200).json(session);
    } catch (error) {
        console.error("Error fetching session:", error);
        res.status(500).json({ error: "Failed to fetch session" });
    }
};