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
exports.updateTherapistDetail = void 0;
const prisma_1 = require("../lib/prisma");
const createUser_1 = require("../utils/createUser");
const updateTherapistDetail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { externalId } = req.params;
    const { specialties, certifications, yearsExperience, verificationStatus, hourlyRate, availableHours, } = req.body;
    try {
        const profile = yield prisma_1.prisma.profile.findUnique({
            where: { externalId },
        });
        if (!profile) {
            const user = yield (0, createUser_1.createOrGetUser)(externalId);
            return;
        }
        const profileId = profile.id;
        // Update or create therapist detail
        const updatedDetail = yield prisma_1.prisma.therapistDetail.upsert({
            where: { profileId },
            update: {
                specialties,
                certifications,
                yearsExperience,
                verificationStatus,
                hourlyRate,
                availableHours,
            },
            create: {
                profileId,
                specialties,
                certifications,
                yearsExperience,
                verificationStatus,
                hourlyRate,
                availableHours,
            },
        });
        res.status(200).json(updatedDetail);
    }
    catch (err) {
        console.error("Error updating therapist detail:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.updateTherapistDetail = updateTherapistDetail;
