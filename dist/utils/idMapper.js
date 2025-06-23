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
exports.mapExternalIdToInternal = mapExternalIdToInternal;
exports.mapInternalIdToExternal = mapInternalIdToExternal;
exports.getActiveConnection = getActiveConnection;
exports.validateUser = validateUser;
exports.clearIdMappingCache = clearIdMappingCache;
exports.getCacheSize = getCacheSize;
const prisma_1 = require("../lib/prisma");
// Two-way in-memory cache
const externalToInternal = new Map();
const internalToExternal = new Map();
/**
 * Gets internal `id` using externalId from auth (req.auth.userId)
 */
function mapExternalIdToInternal(externalId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!externalId)
            return null;
        if (externalToInternal.has(externalId)) {
            return externalToInternal.get(externalId);
        }
        const profile = yield prisma_1.prisma.profile.findUnique({
            where: { externalId, deletedAt: null },
            select: { id: true }
        });
        if (profile) {
            externalToInternal.set(externalId, profile.id);
            internalToExternal.set(profile.id, externalId);
            return profile.id;
        }
        return null;
    });
}
/**
 * Gets externalId using internal `id`
 */
function mapInternalIdToExternal(id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (internalToExternal.has(id)) {
                return internalToExternal.get(id);
            }
            const profile = yield prisma_1.prisma.profile.findUnique({
                where: { id, deletedAt: null },
                select: { externalId: true }
            });
            if (profile) {
                internalToExternal.set(id, profile.externalId);
                externalToInternal.set(profile.externalId, id);
                return profile.externalId;
            }
            return null;
        }
        catch (err) {
            console.error("mapInternalIdToExternal error:", err);
            return null;
        }
    });
}
/**
 * Placeholder for active socket connection lookup
 */
function getActiveConnection(id) {
    return __awaiter(this, void 0, void 0, function* () {
        // Hook this into your actual socket logic (e.g., socketIdMap)
        return null;
    });
}
/**
 * Check if a user is valid + not soft-deleted
 */
function validateUser(externalId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const profile = yield prisma_1.prisma.profile.findUnique({
                where: { externalId, deletedAt: null },
                select: { id: true }
            });
            return !!profile;
        }
        catch (err) {
            console.error("validateUser error:", err);
            return false;
        }
    });
}
/**
 * Cache management utils
 */
function clearIdMappingCache() {
    externalToInternal.clear();
    internalToExternal.clear();
    console.info("ID cache cleared");
}
function getCacheSize() {
    return externalToInternal.size;
}
