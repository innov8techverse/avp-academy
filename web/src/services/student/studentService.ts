import { apiClient } from '../api';

export interface StudentProfile {
  full_name?: string;
  phone_number?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  date_of_birth?: string;
  gender?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export const studentService = {
  getDashboard: async () => {
    try {
      return await apiClient.get('/student/dashboard');
    } catch (error: any) {
      // Check if it's a session-related error
      if (error.response?.status === 401 || 
          error.response?.status === 403 ||
          error.message?.includes('Session expired') ||
          error.message?.includes('SESSION_EXPIRED') ||
          error.message?.includes('No active session found') ||
          error.message?.includes('Session timed out')) {
        
        // This is a session error, throw it with a specific flag
        const sessionError = new Error('SESSION_INVALID');
        sessionError.name = 'SessionError';
        throw sessionError;
      }
      throw error;
    }
  },

  getProfile: async () => {
    try {
      return await apiClient.get('/student/profile');
    } catch (error: any) {
      // Check if it's a session-related error
      if (error.response?.status === 401 || 
          error.response?.status === 403 ||
          error.message?.includes('Session expired') ||
          error.message?.includes('SESSION_EXPIRED') ||
          error.message?.includes('No active session found') ||
          error.message?.includes('Session timed out')) {
        
        // This is a session error, throw it with a specific flag
        const sessionError = new Error('SESSION_INVALID');
        sessionError.name = 'SessionError';
        throw sessionError;
      }
      throw error;
    }
  },

  updateProfile: async (data: StudentProfile) => {
    try {
      return await apiClient.put('/student/profile', data);
    } catch (error: any) {
      // Check if it's a session-related error
      if (error.response?.status === 401 || 
          error.response?.status === 403 ||
          error.message?.includes('Session expired') ||
          error.message?.includes('SESSION_EXPIRED') ||
          error.message?.includes('No active session found') ||
          error.message?.includes('Session timed out')) {
        
        // This is a session error, throw it with a specific flag
        const sessionError = new Error('SESSION_INVALID');
        sessionError.name = 'SessionError';
        throw sessionError;
      }
      throw error;
    }
  },

  changePassword: async (data: ChangePasswordData) => {
    try {
      return await apiClient.post('/student/change-password', data);
    } catch (error: any) {
      // Check if it's a session-related error
      if (error.response?.status === 401 || 
          error.response?.status === 403 ||
          error.message?.includes('Session expired') ||
          error.message?.includes('SESSION_EXPIRED') ||
          error.message?.includes('No active session found') ||
          error.message?.includes('Session timed out')) {
        
        // This is a session error, throw it with a specific flag
        const sessionError = new Error('SESSION_INVALID');
        sessionError.name = 'SessionError';
        throw sessionError;
      }
      throw error;
    }
  },

  getStudentVideos: async () => {
    try {
      return await apiClient.get('/student/videos');
    } catch (error: any) {
      // Check if it's a session-related error
      if (error.response?.status === 401 || 
          error.response?.status === 403 ||
          error.message?.includes('Session expired') ||
          error.message?.includes('SESSION_EXPIRED') ||
          error.message?.includes('No active session found') ||
          error.message?.includes('Session timed out')) {
        
        // This is a session error, throw it with a specific flag
        const sessionError = new Error('SESSION_INVALID');
        sessionError.name = 'SessionError';
        throw sessionError;
      }
      throw error;
    }
  },

  getStudentMaterials: async () => {
    try {
      return await apiClient.get('/student/materials');
    } catch (error: any) {
      // Check if it's a session-related error
      if (error.response?.status === 401 || 
          error.response?.status === 403 ||
          error.message?.includes('Session expired') ||
          error.message?.includes('SESSION_EXPIRED') ||
          error.message?.includes('No active session found') ||
          error.message?.includes('Session timed out')) {
        
        // This is a session error, throw it with a specific flag
        const sessionError = new Error('SESSION_INVALID');
        sessionError.name = 'SessionError';
        throw sessionError;
      }
      throw error;
    }
  }
};
