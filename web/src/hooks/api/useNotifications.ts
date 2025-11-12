
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services/notifications';
import { useToast } from '@/hooks/use-toast';

export const useNotifications = (params: any = {}) => {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: () => notificationService.getNotifications(params),
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
    onError: (error: any) => {
      // Check if it's a session error
      if (error.name === 'SessionError' || error.message === 'SESSION_INVALID') {
        // Remove auth token and user data
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        
        // Dispatch session expired event
        window.dispatchEvent(new CustomEvent('session-expired', {
          detail: { reason: 'Session expired during admin notification fetch' }
        }));
      }
    },
  });
};

export const useStudentNotifications = () => {
  return useQuery({
    queryKey: ['student-notifications'],
    queryFn: () => notificationService.getUserNotifications(),
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
    onError: (error: any) => {
      // Error handling
    },
  });
};

export const useCreateNotification = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => notificationService.createNotification(data),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Notification created successfully',
      });
      // Invalidate all notification-related queries
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['student-notifications'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create notification',
        variant: 'destructive',
      });
    },
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
