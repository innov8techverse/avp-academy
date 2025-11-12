import { Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { prisma } from '../config/database';
import { AuthRequest, UserWithRelations } from '../types';
import { logger } from '../config/logger';

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Access token required'
      });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    const user = await prisma.user.findUnique({
      where: { user_id: decoded.id },
      include: {
        student_profile: {
          include: {
            batch: true,
            course: true
          }
        }
      }
    });

    if (!user || !user.is_active) {
      res.status(401).json({
        success: false,
        message: 'Invalid or inactive user'
      });
      return;
    }

    
    req.headers['user-agent'] = `${req.headers['user-agent'] || ''} | user:${JSON.stringify({
      id: user.user_id,
      role: user.role
    })}`;
    req.headers['user']=JSON.stringify({
      id: user.user_id,
      role: user.role
    })
    
    // Type assertion to match our UserWithRelations type
    req.user = user as UserWithRelations;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
};