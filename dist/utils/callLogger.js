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
exports.createCallLog = createCallLog;
exports.endCallLog = endCallLog;
exports.getCallHistory = getCallHistory;
exports.getCallStatistics = getCallStatistics;
exports.cleanupOldCallLogs = cleanupOldCallLogs;
const prisma_1 = require("../lib/prisma");
/**
 * Creates a new call log entry
 * @param callerId - Internal ID of the caller
 * @param receiverId - Internal ID of the receiver
 * @param callType - Type of call (VIDEO or AUDIO)
 * @returns Created call log
 */
function createCallLog(callerId, receiverId, callType) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const callLog = yield prisma_1.prisma.callLog.create({
                data: {
                    callerId,
                    receiverId,
                    callType,
                    startedAt: new Date(),
                },
                include: {
                    caller: {
                        select: { externalId: true, fullName: true }
                    },
                    receiver: {
                        select: { externalId: true, fullName: true }
                    }
                }
            });
            console.info(`Call log created: ${callLog.id} (${callLog.caller.externalId} -> ${callLog.receiver.externalId})`);
            return callLog;
        }
        catch (error) {
            console.error('Error creating call log:', error);
            throw error;
        }
    });
}
/**
 * Ends a call log by updating end time and calculating duration
 * @param callLogId - ID of the call log to end
 * @returns Updated call log
 */
function endCallLog(callLogId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const endTime = new Date();
            // Get the current call log to calculate duration
            const currentCallLog = yield prisma_1.prisma.callLog.findUnique({
                where: { id: callLogId },
                select: { startedAt: true }
            });
            if (!currentCallLog) {
                throw new Error(`Call log not found: ${callLogId}`);
            }
            // Calculate duration in seconds
            const durationMs = endTime.getTime() - currentCallLog.startedAt.getTime();
            const durationSeconds = Math.floor(durationMs / 1000);
            const updatedCallLog = yield prisma_1.prisma.callLog.update({
                where: { id: callLogId },
                data: {
                    endedAt: endTime,
                    durationSeconds,
                },
                include: {
                    caller: {
                        select: { externalId: true, fullName: true }
                    },
                    receiver: {
                        select: { externalId: true, fullName: true }
                    }
                }
            });
            console.info(`Call log ended: ${callLogId} (Duration: ${durationSeconds}s)`);
            return updatedCallLog;
        }
        catch (error) {
            console.error('Error ending call log:', error);
            throw error;
        }
    });
}
/**
 * Gets call history for a user
 * @param userId - Internal ID of the user
 * @param limit - Maximum number of calls to return
 * @param offset - Number of calls to skip
 * @returns Array of call logs
 */
function getCallHistory(userId_1) {
    return __awaiter(this, arguments, void 0, function* (userId, limit = 50, offset = 0) {
        try {
            const callLogs = yield prisma_1.prisma.callLog.findMany({
                where: {
                    OR: [
                        { callerId: userId },
                        { receiverId: userId }
                    ],
                    deletedAt: null
                },
                include: {
                    caller: {
                        select: { externalId: true, fullName: true, avatarUrl: true }
                    },
                    receiver: {
                        select: { externalId: true, fullName: true, avatarUrl: true }
                    }
                },
                orderBy: { startedAt: 'desc' },
                take: limit,
                skip: offset
            });
            return callLogs;
        }
        catch (error) {
            console.error('Error getting call history:', error);
            throw error;
        }
    });
}
/**
 * Gets call statistics for a user
 * @param userId - Internal ID of the user
 * @returns Call statistics
 */
function getCallStatistics(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const stats = yield prisma_1.prisma.callLog.aggregate({
                where: {
                    OR: [
                        { callerId: userId },
                        { receiverId: userId }
                    ],
                    deletedAt: null,
                    endedAt: { not: null }
                },
                _count: { id: true },
                _sum: { durationSeconds: true },
                _avg: { durationSeconds: true }
            });
            const totalCalls = stats._count.id || 0;
            const totalDuration = stats._sum.durationSeconds || 0;
            const averageDuration = stats._avg.durationSeconds || 0;
            return {
                totalCalls,
                totalDurationSeconds: totalDuration,
                averageDurationSeconds: Math.round(averageDuration),
                totalDurationFormatted: formatDuration(totalDuration),
                averageDurationFormatted: formatDuration(Math.round(averageDuration))
            };
        }
        catch (error) {
            console.error('Error getting call statistics:', error);
            throw error;
        }
    });
}
/**
 * Formats duration in seconds to human-readable format
 * @param seconds - Duration in seconds
 * @returns Formatted duration string
 */
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    if (hours > 0) {
        return `${hours}h ${minutes}m ${remainingSeconds}s`;
    }
    else if (minutes > 0) {
        return `${minutes}m ${remainingSeconds}s`;
    }
    else {
        return `${remainingSeconds}s`;
    }
}
/**
 * Deletes old call logs (soft delete)
 * @param olderThanDays - Delete logs older than this many days
 * @returns Number of deleted logs
 */
function cleanupOldCallLogs() {
    return __awaiter(this, arguments, void 0, function* (olderThanDays = 365) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
            const result = yield prisma_1.prisma.callLog.updateMany({
                where: {
                    startedAt: { lt: cutoffDate },
                    deletedAt: null
                },
                data: {
                    deletedAt: new Date()
                }
            });
            console.info(`Cleaned up ${result.count} call logs older than ${olderThanDays} days`);
            return result.count;
        }
        catch (error) {
            console.error('Error cleaning up old call logs:', error);
            throw error;
        }
    });
}
