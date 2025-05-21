import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import flw from "../utils/flutterwave";
import { Decimal } from "@prisma/client/runtime/library";

export const createOrGetWallet = async (req: Request, res: Response) => {
    try {
      const clerkUserId = req.auth?.userId; // Assuming Clerk middleware is in use
  
      if (!clerkUserId) {
         res.status(401).json({ error: "Unauthorized" });
         return
      }
  
      // Step 1: Get Profile by Clerk ID (externalId)
      const profile = await prisma.profile.findUnique({
        where: { externalId: clerkUserId },
      });
  
      if (!profile) {
         res.status(404).json({ error: "User profile not found" });
         return
      }
  
      // Step 2: Look for an existing wallet
      const wallet = await prisma.wallet.findUnique({
        where: { userId: profile.id },
      });
  
      if (wallet) {
         res.status(200).json(wallet); // Already exists, return it
      }
  
      // Step 3: Create new wallet
      const newWallet = await prisma.wallet.create({
        data: {
          userId: profile.id,
          balance: new Decimal(0.00), 
        },
      });
  
      res.status(201).json(newWallet);
    } catch (error) {
      console.error("Error creating wallet:", error);
       res.status(500).json({ error: "Failed to create or fetch wallet" });
    }
  };
  

  const getProfileFromAuth = async (req: Request) => {
    const externalId = req.auth?.userId;
    if (!externalId) throw new Error("Unauthorized");
    const profile = await prisma.profile.findUnique({ where: { externalId } });
    if (!profile) throw new Error("Profile not found");
    return profile;
  };
  
  // 💰 Deposit to wallet
  export const depositToWallet = async (req: Request, res: Response) => {
    try {
      const profile = await getProfileFromAuth(req);
      const { amount } = req.body;
  
      if (!amount || amount <= 0) {
         res.status(400).json({ error: "Amount must be greater than zero" });
         return
      }
  
      const wallet = await prisma.wallet.findUnique({ where: { userId: profile.id } });
  
      if (!wallet) {
        res.status(404).json({ error: "Wallet not found" });
        return
      }
  
      // You can optionally generate a tx_ref and save it before payment is completed
      const paymentPayload = {
        tx_ref: `deposit-${Date.now()}`,
        amount: amount.toString(),
        currency: "NGN",
        payment_type: "card",
        redirect_url: "http://localhost:5000/payment/callback",
        customer: {
          email: profile.email,
          name: profile.fullName,
        },
      };
  
      const paymentResponse = await flw.Charge.create(paymentPayload);
  
      if (paymentResponse.status === "success") {
         res.status(200).json({
          message: "Payment initiated. Complete the payment using the link.",
          paymentUrl: paymentResponse.data.link,
        });
      } else {
         res.status(400).json({ error: "Payment initiation failed." });
      }
    } catch (error) {
      console.error("💥 Error during deposit:", error);
      res.status(500).json({ error: "Failed to deposit to wallet" });
    }
  };
  
  // 🏧 Withdraw from wallet
  export const withdrawFromWallet = async (req: Request, res: Response) => {
    try {
      const profile = await getProfileFromAuth(req);
      const { amount } = req.body;
  
      if (!amount || amount <= 0) {
        res.status(400).json({ error: "Amount must be greater than zero" });
        return
      }
  
      const wallet = await prisma.wallet.findUnique({ where: { userId: profile.id } });
  
      if (!wallet) {
        res.status(404).json({ error: "Wallet not found" });
        return
      }
  
      const currentBalance = new Decimal(wallet.balance);
      const withdrawalAmount = new Decimal(amount);
  
      if (currentBalance.lessThan(withdrawalAmount)) {
        res.status(400).json({ error: "Insufficient funds" });
        return 
      }
  
      const updatedWallet = await prisma.wallet.update({
        where: { userId: profile.id },
        data: {
          balance: currentBalance.minus(withdrawalAmount),
        },
      });
  
      res.status(200).json({
        message: "Withdrawal successful",
        newBalance: updatedWallet.balance,
      });
    } catch (error) {
      console.error("💥 Error during withdrawal:", error);
      res.status(500).json({ error: "Failed to withdraw from wallet" });
    }
  };
  
  // 👀 Get wallet
  export const getWallet = async (req: Request, res: Response) => {
    try {
      const profile = await getProfileFromAuth(req);
  
      const wallet = await prisma.wallet.findUnique({
        where: { userId: profile.id },
      });
  
      if (!wallet) {
        res.status(404).json({ error: "Wallet not found" });
        return 
      }
  
      res.status(200).json(wallet);
    } catch (error) {
      console.error("💥 Error fetching wallet:", error);
       res.status(500).json({ error: "Failed to fetch wallet details" });
    }
  };