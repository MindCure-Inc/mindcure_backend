import { prisma } from "../lib/prisma";
import { Request } from "express";

// Two-way in-memory cache
const externalToInternal = new Map<string, string>();
const internalToExternal = new Map<string, string>();

/**
 * Gets internal `id` using externalId from auth (req.auth.userId)
 */
export async function mapExternalIdToInternal(externalId: string): Promise<string | null> {
    if (!externalId) return null;
  
    if (externalToInternal.has(externalId)) {
      return externalToInternal.get(externalId)!;
    }
  
    const profile = await prisma.profile.findUnique({
      where: { externalId, deletedAt: null },
      select: { id: true }
    });
  
    if (profile) {
      externalToInternal.set(externalId, profile.id);
      internalToExternal.set(profile.id, externalId);
      return profile.id;
    }
  
    return null;
  }
  

/**
 * Gets externalId using internal `id`
 */
export async function mapInternalIdToExternal(id: string): Promise<string | null> {
  try {
    if (internalToExternal.has(id)) {
      return internalToExternal.get(id)!;
    }

    const profile = await prisma.profile.findUnique({
      where: { id, deletedAt: null },
      select: { externalId: true }
    });

    if (profile) {
      internalToExternal.set(id, profile.externalId);
      externalToInternal.set(profile.externalId, id);
      return profile.externalId;
    }

    return null;
  } catch (err) {
    console.error("mapInternalIdToExternal error:", err);
    return null;
  }
}

/**
 * Placeholder for active socket connection lookup
 */
export async function getActiveConnection(id: string): Promise<string | null> {
  // Hook this into your actual socket logic (e.g., socketIdMap)
  return null;
}

/**
 * Check if a user is valid + not soft-deleted
 */
export async function validateUser(externalId: string): Promise<boolean> {
  try {
    const profile = await prisma.profile.findUnique({
      where: { externalId, deletedAt: null },
      select: { id: true }
    });

    return !!profile;
  } catch (err) {
    console.error("validateUser error:", err);
    return false;
  }
}

/**
 * Cache management utils
 */
export function clearIdMappingCache(): void {
  externalToInternal.clear();
  internalToExternal.clear();
  console.info("ID cache cleared");
}

export function getCacheSize(): number {
  return externalToInternal.size;
}
