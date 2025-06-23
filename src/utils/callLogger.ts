import { prisma } from "../lib/prisma";
import { CallType } from '@prisma/client';

/**
 * Creates a new call log entry
 * @param callerId - Internal ID of the caller
 * @param receiverId - Internal ID of the receiver
 * @param callType - Type of call (VIDEO or AUDIO)
 * @returns Created call log
 */
export async function createCallLog(
  callerId: string, 
  receiverId: string, 
  callType: CallType
) {
  try {
    const callLog = await prisma.callLog.create({
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
  } catch (error) {
    console.error('Error creating call log:', error);
    throw error;
  }
}

/**
 * Ends a call log by updating end time and calculating duration
 * @param callLogId - ID of the call log to end
 * @returns Updated call log
 */
export async function endCallLog(callLogId: string) {
  try {
    const endTime = new Date();
    
    // Get the current call log to calculate duration
    const currentCallLog = await prisma.callLog.findUnique({
      where: { id: callLogId },
      select: { startedAt: true }
    });

    if (!currentCallLog) {
      throw new Error(`Call log not found: ${callLogId}`);
    }

    // Calculate duration in seconds
    const durationMs = endTime.getTime() - currentCallLog.startedAt.getTime();
    const durationSeconds = Math.floor(durationMs / 1000);

    const updatedCallLog = await prisma.callLog.update({
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
  } catch (error) {
    console.error('Error ending call log:', error);
    throw error;
  }
}

/**
 * Gets call history for a user
 * @param userId - Internal ID of the user
 * @param limit - Maximum number of calls to return
 * @param offset - Number of calls to skip
 * @returns Array of call logs
 */
export async function getCallHistory(
  userId: string, 
  limit: number = 50, 
  offset: number = 0
) {
  try {
    const callLogs = await prisma.callLog.findMany({
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
  } catch (error) {
    console.error('Error getting call history:', error);
    throw error;
  }
}

/**
 * Gets call statistics for a user
 * @param userId - Internal ID of the user
 * @returns Call statistics
 */
export async function getCallStatistics(userId: string) {
  try {
    const stats = await prisma.callLog.aggregate({
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
  } catch (error) {
    console.error('Error getting call statistics:', error);
    throw error;
  }
}

/**
 * Formats duration in seconds to human-readable format
 * @param seconds - Duration in seconds
 * @returns Formatted duration string
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
}

/**
 * Deletes old call logs (soft delete)
 * @param olderThanDays - Delete logs older than this many days
 * @returns Number of deleted logs
 */
export async function cleanupOldCallLogs(olderThanDays: number = 365) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await prisma.callLog.updateMany({
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
  } catch (error) {
    console.error('Error cleaning up old call logs:', error);
    throw error;
  }
}