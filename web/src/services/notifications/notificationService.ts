
import { apiClient } from '../api';

// Extend Error interface to include status property
interface SessionError extends Error {
  status?: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'GENERAL' | 'QUIZ' | 'VIDEO' | 'ANNOUNCEMENT' | 'REMINDER';
  isRead: boolean;
  userId?: string;
  data?: any;
  createdAt: string;
}

export interface CreateNotificationData {
  title: string;
  message: string;
  type: 'GENERAL' | 'QUIZ' | 'VIDEO' | 'ANNOUNCEMENT' | 'REMINDER';
  userId?: string;
  data?: any;
  broadcast?: boolean;
  batchIds?: string[];
}

export interface NotificationQuery {
  page?: number;
  limit?: number;
  isRead?: boolean;
}

export const notificationService = {
  // Get notifications for current user (student)
  getUserNotifications: async (params: NotificationQuery = {}) => {
    try {
      const response = await apiClient.get('/notifications', { params });
      return response;
    } catch (error: any) {
      // Check if it's a session-related error
      if (error.response?.status === 401 || 
          error.response?.status === 403 ||
          error.message?.includes('Session expired') ||
          error.message?.includes('SESSION_EXPIRED') ||
          error.message?.includes('No active session found') ||
          error.message?.includes('Session timed out')) {
        
        // This is a session error, throw it with a specific flag
        const sessionError = new Error('SESSION_INVALID') as SessionError;
        sessionError.name = 'SessionError';
        sessionError.status = error.response?.status || 401;
        throw sessionError;
      }
      throw error;
    }
  },

  // Get all notifications (admin)
  getNotifications: async (params: NotificationQuery = {}) => {
    try {
      const response = await apiClient.get('/notifications/admin', { params });
      return response;
    } catch (error: any) {
      // Check if it's a session-related error
      if (error.response?.status === 401 || 
          error.response?.status === 403 ||
          error.message?.includes('Session expired') ||
          error.message?.includes('SESSION_EXPIRED') ||
          error.message?.includes('No active session found') ||
          error.message?.includes('Session timed out')) {
        
        // This is a session error, throw it with a specific flag
        const sessionError = new Error('SESSION_INVALID') as SessionError;
        sessionError.name = 'SessionError';
        sessionError.status = error.response?.status || 401;
        throw sessionError;
      }
      throw error;
    }
  },

  // Create notification for specific user
  createNotification: async (data: CreateNotificationData) => {
    if (data.broadcast) {
      return await apiClient.post('/notifications/broadcast', {
        title: data.title,
        message: data.message,
        type: data.type,
        data: data.data
      });
    } else if (data.batchIds && data.batchIds.length > 0) {
      return await apiClient.post('/notifications/batches', {
        title: data.title,
        message: data.message,
        type: data.type,
        batchIds: data.batchIds,
        data: data.data
      });
    } else {
      return await apiClient.post('/notifications', {
        title: data.title,
        message: data.message,
        type: data.type,
        userId: data.userId,
        data: data.data
      });
    }
  },

  // Broadcast notification to all students
  broadcastNotification: async (data: Omit<CreateNotificationData, 'userId' | 'broadcast'>) => {
    return await apiClient.post('/notifications/broadcast', data);
  },

  // Send notification to specific batches
  sendNotificationToBatches: async (data: Omit<CreateNotificationData, 'userId' | 'broadcast'> & { batchIds: string[] }) => {
    return await apiClient.post('/notifications/batches', data);
  },

  // Mark notification as read
  markAsRead: async (id: string) => {
    return await apiClient.patch(`/notifications/${id}/read`);
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    return await apiClient.patch('/notifications/read-all');
  },

  // Delete notification (admin only)
  deleteNotification: async (id: string) => {
    return await apiClient.delete(`/notifications/${id}`);
  }
};
