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
exports.paymentCallback = void 0;
const flutterwave_1 = __importDefault(require("../utils/flutterwave"));
const prisma_1 = require("../lib/prisma");
const library_1 = require("@prisma/client/runtime/library");
const paymentCallback = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { status, tx_ref } = req.query;
    if (!tx_ref || !status) {
        res.status(400).json({ error: "Invalid callback parameters." });
        return;
    }
    try {
        const verificationResponse = yield flutterwave_1.default.Verification.verifyTransaction(tx_ref);
        if (verificationResponse.status !== "success") {
            res.status(400).json({ message: "Transaction verification failed." });
            return;
        }
        const paymentData = verificationResponse.data;
        if (paymentData.status !== "successful") {
            res.status(400).json({ message: "Payment was not successful." });
            return;
        }
        const session = yield prisma_1.prisma.session.findFirst({
            where: { txRef: tx_ref },
        });
        if (!session) {
            res.status(404).json({ error: "Session not found." });
            return;
        }
        const patientWallet = yield prisma_1.prisma.wallet.findUnique({
            where: { userId: session.patientId },
        });
        const therapistDetail = yield prisma_1.prisma.therapistDetail.findUnique({
            where: { profileId: session.therapistId },
        });
        if (!therapistDetail || !patientWallet) {
            res.status(404).json({ error: "Required data not found." });
            return;
        }
        const rate = (_a = therapistDetail.hourlyRate) !== null && _a !== void 0 ? _a : new library_1.Decimal(0);
        const sessionCost = rate.mul(session.durationMinutes).div(60);
        // ✅ Deduct and mark as completed
        const updatedWallet = yield prisma_1.prisma.wallet.update({
            where: { userId: session.patientId },
            data: {
                balance: patientWallet.balance.minus(sessionCost),
            },
        });
        yield prisma_1.prisma.session.update({
            where: { id: session.id },
            data: {
                status: "completed",
            },
        });
        res.status(200).json({
            message: "Payment successful and session completed.",
            newBalance: updatedWallet.balance,
        });
    }
    catch (error) {
        console.error("Error in callback:", error);
        res.status(500).json({ message: "Error during transaction verification." });
    }
});
exports.paymentCallback = paymentCallback;
