"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWallet = exports.withdrawFromWallet = exports.depositToWallet = exports.createOrGetWallet = void 0;
const prisma_1 = require("../lib/prisma");
const flutterwave_1 = __importDefault(require("../utils/flutterwave"));
const library_1 = require("@prisma/client/runtime/library");
const createOrGetWallet = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const clerkUserId = (_a = req.auth) === null || _a === void 0 ? void 0 : _a.userId; // Assuming Clerk middleware is in use
        if (!clerkUserId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        // Step 1: Get Profile by Clerk ID (externalId)
        const profile = yield prisma_1.prisma.profile.findUnique({
            where: { externalId: clerkUserId },
        });
        if (!profile) {
            res.status(404).json({ error: "User profile not found" });
            return;
        }
        // Step 2: Look for an existing wallet
        const wallet = yield prisma_1.prisma.wallet.findUnique({
            where: { userId: profile.id },
        });
        if (wallet) {
            res.status(200).json(wallet); // Already exists, return it
        }
        // Step 3: Create new wallet
        const newWallet = yield prisma_1.prisma.wallet.create({
            data: {
                userId: profile.id,
                balance: new library_1.Decimal(0.00),
            },
        });
        res.status(201).json(newWallet);
    }
    catch (error) {
        console.error("Error creating wallet:", error);
        res.status(500).json({ error: "Failed to create or fetch wallet" });
    }
});
exports.createOrGetWallet = createOrGetWallet;
const getProfileFromAuth = (req) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const externalId = (_a = req.auth) === null || _a === void 0 ? void 0 : _a.userId;
    if (!externalId)
        throw new Error("Unauthorized");
    const profile = yield prisma_1.prisma.profile.findUnique({ where: { externalId } });
    if (!profile)
        throw new Error("Profile not found");
    return profile;
});
// 💰 Deposit to wallet
const depositToWallet = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const profile = yield getProfileFromAuth(req);
        const { amount } = req.body;
        if (!amount || amount <= 0) {
            res.status(400).json({ error: "Amount must be greater than zero" });
            return;
        }
        const wallet = yield prisma_1.prisma.wallet.findUnique({ where: { userId: profile.id } });
        if (!wallet) {
            res.status(404).json({ error: "Wallet not found" });
            return;
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
        const paymentResponse = yield flutterwave_1.default.Charge.create(paymentPayload);
        if (paymentResponse.status === "success") {
            res.status(200).json({
                message: "Payment initiated. Complete the payment using the link.",
                paymentUrl: paymentResponse.data.link,
            });
        }
        else {
            res.status(400).json({ error: "Payment initiation failed." });
        }
    }
    catch (error) {
        console.error("💥 Error during deposit:", error);
        res.status(500).json({ error: "Failed to deposit to wallet" });
    }
});
exports.depositToWallet = depositToWallet;
// 🏧 Withdraw from wallet
const withdrawFromWallet = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const profile = yield getProfileFromAuth(req);
        const { amount } = req.body;
        if (!amount || amount <= 0) {
            res.status(400).json({ error: "Amount must be greater than zero" });
            return;
        }
        const wallet = yield prisma_1.prisma.wallet.findUnique({ where: { userId: profile.id } });
        if (!wallet) {
            res.status(404).json({ error: "Wallet not found" });
            return;
        }
        const currentBalance = new library_1.Decimal(wallet.balance);
        const withdrawalAmount = new library_1.Decimal(amount);
        if (currentBalance.lessThan(withdrawalAmount)) {
            res.status(400).json({ error: "Insufficient funds" });
            return;
        }
        const updatedWallet = yield prisma_1.prisma.wallet.update({
            where: { userId: profile.id },
            data: {
                balance: currentBalance.minus(withdrawalAmount),
            },
        });
        res.status(200).json({
            message: "Withdrawal successful",
            newBalance: updatedWallet.balance,
        });
    }
    catch (error) {
        console.error("💥 Error during withdrawal:", error);
        res.status(500).json({ error: "Failed to withdraw from wallet" });
    }
});
exports.withdrawFromWallet = withdrawFromWallet;
// 👀 Get wallet
const getWallet = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const profile = yield getProfileFromAuth(req);
        const wallet = yield prisma_1.prisma.wallet.findUnique({
            where: { userId: profile.id },
        });
        if (!wallet) {
            res.status(404).json({ error: "Wallet not found" });
            return;
        }
        res.status(200).json(wallet);
    }
    catch (error) {
        console.error("💥 Error fetching wallet:", error);
        res.status(500).json({ error: "Failed to fetch wallet details" });
    }
});
exports.getWallet = getWallet;
