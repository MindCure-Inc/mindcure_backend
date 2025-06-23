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
exports.getSessionById = exports.getSessions = exports.cancelSession = exports.updateSession = exports.bookSession = void 0;
const prisma_1 = require("../lib/prisma");
const createUser_1 = require("../utils/createUser");
const prisma_2 = require("../generated/prisma");
var Decimal = prisma_2.Prisma.Decimal;
const flutterwave_1 = __importDefault(require("../utils/flutterwave"));
function getPatientIdFromClerkUserId(clerkUserId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!clerkUserId)
            return null;
        const profile = yield prisma_1.prisma.profile.findUnique({
            where: { externalId: clerkUserId },
        });
        return (profile === null || profile === void 0 ? void 0 : profile.id) || null;
    });
}
// Book a new session
const bookSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const patientId = (_a = req.auth) === null || _a === void 0 ? void 0 : _a.userId;
        if (!patientId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const { therapistId: externalTherapistId, scheduledAt, durationMinutes, type } = req.body;
        if (!externalTherapistId || !scheduledAt || !durationMinutes || !type) {
            res.status(400).json({ error: "Missing required fields" });
            return;
        }
        const patientProfile = yield (0, createUser_1.createOrGetUser)(patientId);
        if (!patientProfile) {
            res.status(400).json({ error: "Invalid patient information." });
            return;
        }
        // 🧠 LOOKUP: Convert Clerk therapist ID → internal therapist profile ID
        const therapistProfile = yield prisma_1.prisma.profile.findUnique({
            where: { externalId: externalTherapistId },
        });
        if (!therapistProfile) {
            res.status(404).json({ error: "Therapist not found." });
            return;
        }
        // Check for conflicting session
        const conflictingSession = yield prisma_1.prisma.session.findFirst({
            where: {
                therapistId: therapistProfile.id,
                scheduledAt: new Date(scheduledAt),
                status: { notIn: ["cancelled"] },
            },
        });
        if (conflictingSession) {
            res.status(409).json({ error: "Therapist already has a session at this time." });
            return;
        }
        // Book the session
        const session = yield prisma_1.prisma.session.create({
            data: {
                therapistId: therapistProfile.id,
                patientId: patientProfile.id,
                scheduledAt: new Date(scheduledAt),
                durationMinutes,
                type,
            },
        });
        res.status(201).json(session);
    }
    catch (error) {
        console.error("Error booking session:", error);
        res.status(500).json({ error: "Failed to book session" });
    }
});
exports.bookSession = bookSession;
// Update session status
const updateSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const { status } = req.body;
        const session = yield prisma_1.prisma.session.findUnique({ where: { id } });
        if (!session) {
            res.status(404).json({ error: "Session not found" });
            return;
        }
        if (status !== "completed") {
            // If not marking as completed, just update normally
            const updated = yield prisma_1.prisma.session.update({
                where: { id },
                data: { status },
            });
            res.status(200).json(updated);
            return;
        }
        const therapistDetail = yield prisma_1.prisma.therapistDetail.findUnique({
            where: { profileId: session.therapistId },
        });
        if (!therapistDetail) {
            res.status(404).json({ error: "Therapist details not found." });
            return;
        }
        const patientWallet = yield prisma_1.prisma.wallet.findUnique({
            where: { userId: session.patientId },
        });
        const rate = (_a = therapistDetail.hourlyRate) !== null && _a !== void 0 ? _a : new Decimal(0);
        const sessionCost = rate.mul(session.durationMinutes).div(60);
        if (!patientWallet) {
            res.status(404).json({ error: "Patient wallet not found." });
            return;
        }
        if (patientWallet.balance.gte(sessionCost)) {
            // Patient can afford it, deduct & mark as completed
            const updatedWallet = yield prisma_1.prisma.wallet.update({
                where: { userId: session.patientId },
                data: {
                    balance: patientWallet.balance.minus(sessionCost),
                },
            });
            const updatedSession = yield prisma_1.prisma.session.update({
                where: { id },
                data: { status: "completed" },
            });
            res.status(200).json({
                message: "Session completed and wallet charged.",
                session: updatedSession,
                newBalance: updatedWallet.balance,
            });
        }
        else {
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
            const paymentResponse = yield flutterwave_1.default.Charge.create(paymentPayload);
            if (paymentResponse.status === "success") {
                yield prisma_1.prisma.session.update({
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
                return;
            }
            else {
                res.status(400).json({ error: "Payment initiation failed." });
            }
        }
    }
    catch (error) {
        console.error("Error updating session:", error);
        res.status(500).json({ error: "Failed to update session" });
    }
});
exports.updateSession = updateSession;
// Cancel session
const cancelSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const session = yield prisma_1.prisma.session.update({
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
    }
    catch (error) {
        console.error("Error cancelling session:", error);
        res.status(500).json({ error: "Failed to cancel session" });
    }
});
exports.cancelSession = cancelSession;
// Get all sessions for a user
const getSessions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const clerkUserId = (_a = req.auth) === null || _a === void 0 ? void 0 : _a.userId;
    if (!clerkUserId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const userId = yield getPatientIdFromClerkUserId(clerkUserId);
    if (!userId) {
        res.status(404).json({ error: "User profile not found" });
        return;
    }
    try {
        const sessions = yield prisma_1.prisma.session.findMany({
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
    }
    catch (error) {
        console.error("Error fetching sessions:", error);
        res.status(500).json({ error: "Failed to fetch sessions" });
    }
});
exports.getSessions = getSessions;
// 👇 Get one session by ID
const getSessionById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const session = yield prisma_1.prisma.session.findUnique({
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
    }
    catch (error) {
        console.error("Error fetching session:", error);
        res.status(500).json({ error: "Failed to fetch session" });
    }
});
exports.getSessionById = getSessionById;
