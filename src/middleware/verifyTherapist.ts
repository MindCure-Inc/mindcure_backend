import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

// Clerk's userId is in `req.auth.userId` (you must ensure the auth middleware is applied)
declare global {
    namespace Express {
        interface Request {
            auth?: {
                userId?: string;
            };
        }
    }
}

export const verifyTherapist = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.auth?.userId;

        if (!userId) {
            res.status(401).json({ error: "Unauthorized: user ID not found" });
        }

        // Step 1: Find profile by Clerk externalId
        const profile = await prisma.profile.findUnique({
            where: { externalId: userId },
        });

        if (!profile) {
            res.status(404).json({ error: "Profile not found" });
            return
        }

        // Step 2: Check if this profile is also in TherapistDetail
        const therapist = await prisma.therapistDetail.findUnique({
            where: { profileId: profile.id },
        });

        if (!therapist) {
            res.status(403).json({ error: "Access denied: Therapist role required" });
            return
        }

        // ✅ Passed verification
        (req as any).therapistId = therapist.id;

        next();
    } catch (err) {
        console.error("verifyTherapist error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};
