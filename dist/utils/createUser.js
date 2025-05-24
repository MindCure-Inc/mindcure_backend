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
exports.createOrGetUser = void 0;
const prisma_1 = require("../lib/prisma");
const clerk_sdk_node_1 = require("@clerk/clerk-sdk-node");
const prisma_2 = require("../generated/prisma");
const prisma_3 = require("../generated/prisma");
const createOrGetUser = (clerkId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    let user = yield prisma_1.prisma.profile.findUnique({
        where: { externalId: clerkId },
    });
    if (user)
        return user;
    const clerkUser = yield clerk_sdk_node_1.clerkClient.users.getUser(clerkId);
    const metadata = clerkUser.unsafeMetadata || {};
    const fullName = `${(_a = clerkUser.firstName) !== null && _a !== void 0 ? _a : ""} ${(_b = clerkUser.lastName) !== null && _b !== void 0 ? _b : ""}`.trim();
    user = yield prisma_1.prisma.profile.create({
        data: {
            externalId: clerkId,
            fullName,
            email: (_d = (_c = clerkUser.emailAddresses[0]) === null || _c === void 0 ? void 0 : _c.emailAddress) !== null && _d !== void 0 ? _d : "",
            avatarUrl: (_e = clerkUser.imageUrl) !== null && _e !== void 0 ? _e : "",
            role: (_f = metadata.role) !== null && _f !== void 0 ? _f : "patient",
            bio: (_g = metadata.bio) !== null && _g !== void 0 ? _g : "",
            phone: (_h = metadata.phone) !== null && _h !== void 0 ? _h : "",
        },
    });
    if (user.role === "therapist") {
        yield prisma_1.prisma.therapistDetail.create({
            data: {
                profileId: user.id,
                specialties: (metadata.specialties && Array.isArray(metadata.specialties) ? metadata.specialties : []),
                certifications: (metadata.certifications && Array.isArray(metadata.certifications) ? metadata.certifications : []),
                yearsExperience: typeof metadata.yearsExperience === 'number' ? metadata.yearsExperience : 0,
                verificationStatus: prisma_2.VerificationStatus.pending,
                hourlyRate: typeof metadata.hourlyRate === 'number' ? metadata.hourlyRate : null,
                availableHours: metadata.availableHours && typeof metadata.availableHours === "object"
                    ? metadata.availableHours
                    : prisma_3.Prisma.JsonNull,
            }
        });
    }
    return user;
});
exports.createOrGetUser = createOrGetUser;
