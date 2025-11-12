
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance with default configuration
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Check if it's a session expiration error
      const errorData = error.response?.data;
      if (errorData?.code === 'SESSION_EXPIRED' || errorData?.message?.includes('Session expired')) {
        // Clear local storage
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        
        // Show toast notification if available
        if (window.toast) {
          window.toast({
            title: 'Session Expired',
            description: 'Your session has expired. Please log in again.',
            variant: 'destructive',
          });
        }
        
        // Redirect to login page
        window.location.href = '/';
      } else {
        // Regular 401 error - just clear token and redirect
        localStorage.removeItem('authToken');
        window.location.href = '/';
      }
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

export default apiClient;
