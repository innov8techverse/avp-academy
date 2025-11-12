import { prisma } from '../config/database';
import { logger } from '../config/logger';

// Session timeout in minutes (configurable)
const SESSION_TIMEOUT_MINUTES = parseInt(process.env.SESSION_TIMEOUT_MINUTES || '30');

/**
 * Check if a session has timed out due to inactivity
 */
export const isSessionTimedOut = (lastActive: Date): boolean => {
  const now = new Date();
  const timeoutMs = SESSION_TIMEOUT_MINUTES * 60 * 1000;
  const timeSinceLastActive = now.getTime() - lastActive.getTime();
  
  return timeSinceLastActive > timeoutMs;
};

/**
 * Clean up expired sessions
 */
export const cleanupExpiredSessions = async (): Promise<number> => {
  try {
    const timeoutThreshold = new Date(Date.now() - (SESSION_TIMEOUT_MINUTES * 60 * 1000));
    
    const result = await prisma.session.updateMany({
      where: {
        last_active: {
          lt: timeoutThreshold
        },
        is_active: true
      },
      data: {
        is_active: false
      }
    });

    if (result.count > 0) {
      logger.info(`Cleaned up ${result.count} expired sessions`);
    }

    return result.count;
  } catch (error) {
    logger.error('Error cleaning up expired sessions:', error);
    return 0;
  }
};

/**
 * Validate session and check for timeout
 */
export const validateSessionAndTimeout = async (userId: number): Promise<{
  isValid: boolean;
  session: any;
  reason?: string;
}> => {
  try {
    const session = await prisma.session.findFirst({
      where: {
        user_id: userId,
        is_active: true
      }
    });

    if (!session) {
      return {
        isValid: false,
        session: null,
        reason: 'No active session found'
      };
    }

    // Check if session has timed out
    if (isSessionTimedOut(session.last_active)) {
      // Mark session as inactive
      await prisma.session.update({
        where: { id: session.id },
        data: { is_active: false }
      });

      return {
        isValid: false,
        session: null,
        reason: 'Session timed out due to inactivity'
      };
    }

    return {
      isValid: true,
      session
    };
  } catch (error) {
    logger.error('Error validating session:', error);
    return {
      isValid: false,
      session: null,
      reason: 'Error validating session'
    };
  }
};
