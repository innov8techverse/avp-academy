
import { Response, NextFunction } from 'express';

import { AuthRequest } from '../types';
import { logger } from '../config/logger';
import jwt from 'jsonwebtoken';

// Store active sessions in memory (use Redis in production)
const activeSessions = new Map<string, { token: string, loginTime: Date }>();

export const sessionManager = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.decode(token) as any;
    
    if (!decoded || !decoded.id) {
      return next();
    }

    const userId = decoded.id;
    const existingSession = activeSessions.get(userId);

    // Check for concurrent sessions
    if (existingSession && existingSession.token !== token) {
      // Invalidate the previous session
      activeSessions.delete(userId);
      
      return res.status(401).json({
        success: false,
        message: 'Session expired due to login from another device',
        code: 'CONCURRENT_LOGIN'
      });
    }

    // Update session
    activeSessions.set(userId, { token, loginTime: new Date() });

    next();
  } catch (error) {
    logger.error('Session manager error:', error);
    next();
  }
};

export const createSession = (userId: string, token: string) => {
  activeSessions.set(userId, { token, loginTime: new Date() });
};

export const destroySession = (userId: string) => {
  activeSessions.delete(userId);
};

export const isSessionActive = (userId: string, token: string): boolean => {
  const session = activeSessions.get(userId);
  return session ? session.token === token : false;
};
