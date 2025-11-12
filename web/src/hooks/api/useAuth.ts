
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService, LoginCredentials, RegisterData, ForgotPasswordData, ResetPasswordData } from '@/services/auth';
import { useToast } from '@/hooks/use-toast';

export const useLogin = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: (data) => {
      // Store token in localStorage
      localStorage.setItem('authToken', data.data.token);
      
      // Invalidate profile query to fetch fresh user data
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      toast({
        title: 'Success',
        description: 'Logged in successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Login failed',
        variant: 'destructive',
      });
    },
  });
};

export const useRegister = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: RegisterData) => authService.register(userData),
    onSuccess: (data) => {
      // Store token in localStorage
      localStorage.setItem('authToken', data.data.token);
      
      // Invalidate profile query to fetch fresh user data
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      toast({
        title: 'Success',
        description: 'Account created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Registration failed',
        variant: 'destructive',
      });
    },
  });
};

export const useProfile = () => {
  const token = localStorage.getItem('authToken');
  
  return useQuery({
    queryKey: ['profile'],
    queryFn: authService.getProfile,
    retry: false,
    enabled: !!token // Only fetch if token exists
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => authService.logout(data),
    onSuccess: () => {
      queryClient.clear();
      window.location.reload();
    },
  });
};

export const useForgotPassword = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: ForgotPasswordData) => authService.forgotPassword(data),
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: data.message || 'Password reset email sent successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send reset email',
        variant: 'destructive',
      });
    },
  });
};

export const useResetPassword = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: ResetPasswordData) => authService.resetPassword(data),
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: data.message || 'Password reset successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reset password',
        variant: 'destructive',
      });
    },
  });
};

export const useVerifyResetToken = (token: string) => {
  return useQuery({
    queryKey: ['verifyResetToken', token],
    queryFn: () => authService.verifyResetToken(token),
    enabled: !!token,
    retry: false,
  });
};

export const useVerifyOTP = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: { email: string; otp: string }) => authService.verifyOTP(data),
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: data.message || 'OTP verified successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to verify OTP',
        variant: 'destructive',
      });
    },
  });
};

export const useValidateSession = () => {
  return useQuery({
    queryKey: ['validateSession'],
    queryFn: authService.validateSession,
    retry: false,
    enabled: !!localStorage.getItem('authToken'),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    refetchIntervalInBackground: true,
  });
};
