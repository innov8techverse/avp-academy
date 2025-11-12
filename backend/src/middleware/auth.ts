import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { validateSessionAndTimeout } from '../utils/sessionUtils';

const prisma = new PrismaClient();

// Extend Express Request type to include user
export interface AuthRequest extends Request {
  user?: {
    user_id: number;
    role: string;
  };
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
      user_id: number;
      role: string;
    };

    // Verify user exists and is active
    const user = await prisma.user.findUnique({
      where: { user_id: decoded.user_id },
      select: { user_id: true, role: true, is_active: true }
    });

    if (!user || !user.is_active) {
      return res.status(401).json({ message: 'Invalid or inactive user' });
    }

    // Verify session exists, is active, and hasn't timed out
    const sessionValidation = await validateSessionAndTimeout(decoded.user_id);

    if (!sessionValidation.isValid) {
      return res.status(401).json({ 
        message: sessionValidation.reason || 'Session expired or invalid',
        code: 'SESSION_EXPIRED'
      });
    }

    // Update last_active timestamp
    await prisma.session.update({
      where: { id: sessionValidation.session.id },
      data: { last_active: new Date() }
    });

    req.user = {
      user_id: user.user_id,
      role: user.role
    };

    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const authorize = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): Response | void => {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    return next();
  };
}; 