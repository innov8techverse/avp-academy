import { toast } from "sonner";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: 'STUDENT' | 'ADMIN';
}

export interface ForgotPasswordData {
  email: string;
}

// Support both token-based and OTP-based password resets
export interface ResetPasswordData {
  token?: string; // when using a reset link
  otp?: string;   // when using an emailed OTP
  password: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  avatar?: string;
  studentProfile?: any;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    return response.json();
  },

  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    return response.json();
  },

  async forgotPassword(data: ForgotPasswordData): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send reset email');
    }

    return response.json();
  },

  async resetPassword(data: ResetPasswordData): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to reset password');
    }

    return response.json();
  },

  async verifyOTP(data: { email: string; otp: string }): Promise<{ success: boolean; message: string; data?: any }> {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to verify OTP');
    }

    return response.json();
  },

  async verifyResetToken(token: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/verify-reset-token/${token}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Invalid reset token');
    }

    return response.json();
  },

  async getProfile(): Promise<{ success: boolean; data: User }> {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const apiUrl = `${import.meta.env.VITE_API_URL}/auth/profile`;

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get profile');
    }

    const result = await response.json();
    return result;
  },

  async logout (user_id: string): Promise<{ success: boolean; message: string }> {
    const token = localStorage.getItem('authToken');

    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_id })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to logout');
    }
    localStorage.removeItem('authToken');

    return response.json();
  },

  async validateSession(): Promise<{ success: boolean; message: string; data?: any }> {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      handleSessionExpiration();
      throw new Error('No authentication token found');
    }

    const apiUrl = `${import.meta.env.VITE_API_URL}/auth/validate-session`;
  
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if(response.status === 401){
      handleSessionExpiration();
      toast.error('Session expired, please login again');
      throw new Error('Session validation failed');
    }
    if (!response.ok) {
      const error = await response.json();
      
      throw new Error(error.message || 'Session validation failed');
    }

    const result = await response.json();
    
    return result;
  },

  // Function to handle session expiration
 
};
function handleSessionExpiration() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  
  // Redirect to login page
  window.location.href = '/';
}