import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../types';
import { logger } from '../config/logger';
import type { Prisma, NotificationType, Role } from '@prisma/client';

// Create Notification
export const createNotification = async (req: AuthRequest, res: Response) => {
  try {
    const { title, message, type, userId, data } = req.body;

    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type: type as NotificationType,
        user_id: userId,
        data
      }
    });

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: notification
    });
  } catch (error) {
    logger.error('Create notification error:', error);
    res.status(500).json({ success: false, message: 'Failed to create notification' });
  }
};

// Broadcast Notification to All Students
export const broadcastNotification = async (req: AuthRequest, res: Response) => {
  try {
    const { title, message, type, data } = req.body;

    // Get all active students
    const students = await prisma.user.findMany({
      where: { 
        role: 'STUDENT' as Role,
        is_active: true 
      },
      select: { user_id: true }
    });

    // Create notifications for all students
    const notifications = students.map(student => ({
      title,
      message,
      type: type as NotificationType,
      user_id: student.user_id,
      data
    }));

    await prisma.notification.createMany({
      data: notifications
    });

    res.json({
      success: true,
      message: `Notification sent to ${students.length} students`,
      data: { sentTo: students.length }
    });
  } catch (error) {
    logger.error('Broadcast notification error:', error);
    res.status(500).json({ success: false, message: 'Failed to broadcast notification' });
  }
};

// Send Notification to Specific Batches
export const sendNotificationToBatches = async (req: AuthRequest, res: Response) => {
  try {
    const { title, message, type, batchIds, data } = req.body;

    if (!batchIds || !Array.isArray(batchIds) || batchIds.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Batch IDs are required'
      });
      return;
    }

    // Get students in the specified batches
    const students = await prisma.user.findMany({
      where: { 
        role: 'STUDENT' as Role,
        is_active: true,
        student_profile: {
          batch_id: {
            in: batchIds.map(id => parseInt(id))
          }
        }
      },
      select: { user_id: true }
    });

    if (students.length === 0) {
      res.status(404).json({
        success: false,
        message: 'No students found in the specified batches'
      });
      return;
    }

    // Create notifications for students in the specified batches
    const notifications = students.map(student => ({
      title,
      message,
      type: type as NotificationType,
      user_id: student.user_id,
      data
    }));

    await prisma.notification.createMany({
      data: notifications
    });

    res.json({
      success: true,
      message: `Notification sent to ${students.length} students in ${batchIds.length} batch(es)`,
      data: { 
        sentTo: students.length,
        batches: batchIds.length
      }
    });
  } catch (error) {
    logger.error('Send notification to batches error:', error);
    res.status(500).json({ success: false, message: 'Failed to send notification to batches' });
  }
};

// Get All Notifications (Admin)
export const getAllNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, isRead } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: Prisma.NotificationWhereInput = {};

    if (isRead !== undefined) {
      where.is_read = isRead === 'true';
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { created_at: 'desc' },
        include: {
          user: {
            select: {
              user_id: true,
              full_name: true,
              email: true
            }
          }
        }
      }),
      prisma.notification.count({ where })
    ]);

    res.json({
      success: true,
      data: notifications,
      meta: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    logger.error('Get all notifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
};

// Get Notifications for User
export const getUserNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.user_id;
    const { page = 1, limit = 20, isRead } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: Prisma.NotificationWhereInput = {
      OR: [
        { user_id: userId },
        { user_id: null } // Global notifications
      ]
    };

    if (isRead !== undefined) {
      where.is_read = isRead === 'true';
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { created_at: 'desc' }
      }),
      prisma.notification.count({ where })
    ]);

    res.json({
      success: true,
      data: notifications,
      meta: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    logger.error('Get user notifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
};

// Mark Notification as Read
export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.user_id;
    const notificationId = parseInt(id);

    if (isNaN(notificationId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid notification ID'
      });
      return;
    }

    const notification = await prisma.notification.update({
      where: { 
        notification_id: notificationId,
        OR: [
          { user_id: userId },
          { user_id: null }
        ]
      },
      data: { is_read: true }
    });

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    logger.error('Mark notification as read error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
  }
};

// Mark All Notifications as Read
export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.user_id;

    await prisma.notification.updateMany({
      where: {
        OR: [
          { user_id: userId },
          { user_id: null }
        ],
        is_read: false
      },
      data: { is_read: true }
    });

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    logger.error('Mark all notifications as read error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark all notifications as read' });
  }
};

// Delete Notification
export const deleteNotification = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const notificationId = parseInt(id);

    if (isNaN(notificationId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid notification ID'
      });
      return;
    }

    await prisma.notification.delete({
      where: { notification_id: notificationId }
    });

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    logger.error('Delete notification error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete notification' });
  }
};
