import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import flw from "../utils/flutterwave";
import { Decimal } from "@prisma/client/runtime/library";

export const createOrGetWallet = async (req: Request, res: Response) => {
    try {
        const { userId } = req.body;

        const wallet = await prisma.wallet.findUnique({
            where: { userId }
        });

        if (wallet) {
            res.status(200).json(wallet); // If wallet already exists, return it
            return
        }

        // If no wallet exists for the user, create one
        const newWallet = await prisma.wallet.create({
            data: {
                userId,
                balance: new Decimal(0.00), // Initial balance
            },
        });

        res.status(201).json(newWallet); // Return the newly created wallet
    } catch (error) {
        console.error("Error creating wallet:", error);
        res.status(500).json({ error: "Failed to create or fetch wallet" });
    }
};

export const depositToWallet = async (req: Request, res: Response) => {
    try {
        const { userId, amount } = req.body;

        if (amount <= 0) {
            res.status(400).json({ error: "Amount must be greater than zero" });
            return
        }

        const wallet = await prisma.wallet.findUnique({
            where: { userId }
        });

        if (!wallet) {
            res.status(404).json({ error: "Wallet not found" });
            return
        }

        const paymentPayload = {
            tx_ref: `deposit-${Date.now()}`,
            amount: amount,
            currency: "NGN",
            payment_type: "card",
            redirect_url: "http://localhost:5000/payment/callback",
        };

        const paymentResponse = await flw.Charge.create(paymentPayload);

        if (paymentResponse.status === "success") {
            res.status(200).json({
                message: "Payment initiated, please proceed with the payment.",
                paymentUrl: paymentResponse.data.link,
            });
            return
        } else {
            res.status(400).json({ error: "Payment initiation failed." });
        }
    } catch (error) {
        console.error("Error during deposit:", error);
        res.status(500).json({ error: "Failed to deposit to wallet" });
    }
};

export const withdrawFromWallet = async (req: Request, res: Response) => {
    try {
        const { userId, amount } = req.body;

        if (amount <= 0) {
            res.status(400).json({ error: "Amount must be greater than zero" });
            return
        }

        const wallet = await prisma.wallet.findUnique({
            where: { userId }
        });

        if (!wallet) {
            res.status(404).json({ error: "Wallet not found" });
            return
        }

        if (wallet.balance < amount) {
            res.status(400).json({ error: "Insufficient funds" });
            return
        }

        const updatedWallet = await prisma.wallet.update({
            where: { userId },
            data: {
                balance: new Decimal(wallet.balance).minus(amount),
            },
        });

        res.status(200).json({
            message: "Withdrawal successful",
            newBalance: updatedWallet.balance,
        });
    } catch (error) {
        console.error("Error during withdrawal:", error);
        res.status(500).json({ error: "Failed to withdraw from wallet" });
    }
};

export const getWallet = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        const wallet = await prisma.wallet.findUnique({
            where: { userId },
        });

        if (!wallet) {
            res.status(404).json({ error: "Wallet not found" });
            return
        }

        res.status(200).json(wallet);
    } catch (error) {
        console.error("Error fetching wallet details:", error);
        res.status(500).json({ error: "Failed to fetch wallet details" });
    }
};