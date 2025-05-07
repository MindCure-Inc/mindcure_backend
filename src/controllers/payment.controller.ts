import { Request, Response } from 'express';
import flw from '../utils/flutterwave';
import { prisma } from "../lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export const paymentCallback = async (req: Request, res: Response): Promise<void> => {
    const { status, tx_ref } = req.query;

    if (!tx_ref || !status) {
        res.status(400).json({ error: "Invalid callback parameters." });
        return;
    }

    try {
        const verificationResponse = await flw.Verification.verifyTransaction(tx_ref as string);
        if (verificationResponse.status !== "success") {
            res.status(400).json({ message: "Transaction verification failed." });
            return
        }

        const paymentData = verificationResponse.data;
        if (paymentData.status !== "successful") {
            res.status(400).json({ message: "Payment was not successful." });
            return
        }

        const session = await prisma.session.findFirst({
            where: { txRef: tx_ref as string },
        });

        if (!session) {
            res.status(404).json({ error: "Session not found." });
            return
        }

        const patientWallet = await prisma.wallet.findUnique({
            where: { userId: session.patientId },
        });

        const therapistDetail = await prisma.therapistDetail.findUnique({
            where: { profileId: session.therapistId },
        });

        if (!therapistDetail || !patientWallet) {
            res.status(404).json({ error: "Required data not found." });
            return
        }

        const rate = therapistDetail.hourlyRate ?? new Decimal(0);
        const sessionCost = rate.mul(session.durationMinutes).div(60);

        // ✅ Deduct and mark as completed
        const updatedWallet = await prisma.wallet.update({
            where: { userId: session.patientId },
            data: {
                balance: patientWallet.balance.minus(sessionCost),
            },
        });

        await prisma.session.update({
            where: { id: session.id },
            data: {
                status: "completed",
            },
        });

        res.status(200).json({
            message: "Payment successful and session completed.",
            newBalance: updatedWallet.balance,
        });

    } catch (error) {
        console.error("Error in callback:", error);
        res.status(500).json({ message: "Error during transaction verification." });
    }
};
