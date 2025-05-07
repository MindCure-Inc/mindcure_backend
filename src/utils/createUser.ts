import { prisma } from "../lib/prisma";
import { clerkClient } from "@clerk/clerk-sdk-node";
import {UserRole, VerificationStatus} from "../generated/prisma";
import { Prisma } from "../generated/prisma";

type JsonInput = string | number | boolean | null | JsonInput[] | { [key: string]: JsonInput };

export const createOrGetUser = async (clerkId: string) => {
    let user = await prisma.profile.findUnique({
        where: { externalId: clerkId },
    });

    if (user) return user;

    const clerkUser = await clerkClient.users.getUser(clerkId);
    const metadata = clerkUser.unsafeMetadata || {};
    const fullName = `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim();

    user = await prisma.profile.create({
        data: {
            externalId: clerkId,
            fullName,
            email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
            avatarUrl: clerkUser.imageUrl ?? "",
            role: (metadata.role as UserRole) ?? "patient",
            bio: (metadata.bio as string) ?? "",
            phone: (metadata.phone as string) ?? "",
        },
    });

    if (user.role === "therapist") {
        await prisma.therapistDetail.create({
            data: {
                profileId: user.id,
                specialties: (metadata.specialties && Array.isArray(metadata.specialties) ? metadata.specialties : []),
                certifications: (metadata.certifications && Array.isArray(metadata.certifications) ? metadata.certifications : []),
                yearsExperience: typeof metadata.yearsExperience === 'number' ? metadata.yearsExperience : 0,
                verificationStatus: VerificationStatus.pending,
                hourlyRate: typeof metadata.hourlyRate === 'number' ? metadata.hourlyRate : null,
                availableHours:
                    metadata.availableHours && typeof metadata.availableHours === "object"
                        ? metadata.availableHours as Prisma.InputJsonValue
                        : Prisma.JsonNull,
            }
        })
    }

    return user;
}