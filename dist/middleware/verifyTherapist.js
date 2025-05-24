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
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyTherapist = void 0;
const prisma_1 = require("../lib/prisma");
const verifyTherapist = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.auth) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized: user ID not found" });
        }
        // Step 1: Find profile by Clerk externalId
        const profile = yield prisma_1.prisma.profile.findUnique({
            where: { externalId: userId },
        });
        if (!profile) {
            res.status(404).json({ error: "Profile not found" });
            return;
        }
        // Step 2: Check if this profile is also in TherapistDetail
        const therapist = yield prisma_1.prisma.therapistDetail.findUnique({
            where: { profileId: profile.id },
        });
        if (!therapist) {
            res.status(403).json({ error: "Access denied: Therapist role required" });
            return;
        }
        // ✅ Passed verification
        req.therapistId = therapist.id;
        next();
    }
    catch (err) {
        console.error("verifyTherapist error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.verifyTherapist = verifyTherapist;
