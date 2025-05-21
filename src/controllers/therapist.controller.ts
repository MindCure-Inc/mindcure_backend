import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { createOrGetUser } from "../utils/createUser";

export const updateTherapistDetail = async (req: Request, res: Response) => {
  const { externalId } = req.params;
  const {
    specialties,
    certifications,
    yearsExperience,
    verificationStatus,
    hourlyRate,
    availableHours,
  } = req.body;

  try {
    const profile = await prisma.profile.findUnique({
      where: { externalId },
    });

    if (!profile) {
          const user = await createOrGetUser(externalId);
      return 
    }

    const profileId = profile.id;

    // Update or create therapist detail
    const updatedDetail = await prisma.therapistDetail.upsert({
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
  } catch (err: any) {
    console.error("Error updating therapist detail:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};