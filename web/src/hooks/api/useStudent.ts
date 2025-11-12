
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentService, StudentProfile, ChangePasswordData } from '@/services/student';
import { useToast } from '@/hooks/use-toast';

export const useStudentDashboard = () => {
  return useQuery({
    queryKey: ['student-dashboard'],
    queryFn: studentService.getDashboard,
  });
};

export const useStudentProfile = () => {
  return useQuery({
    queryKey: ['student-profile'],
    queryFn: studentService.getProfile,
  });
};

export const useUpdateStudentProfile = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: StudentProfile) => studentService.updateProfile(data),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['student-profile'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    },
  });
};

export const useChangePassword = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: ChangePasswordData) => studentService.changePassword(data),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Password changed successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to change password',
        variant: 'destructive',
      });
    },
  });
};

export const useStudentVideos = () => {
  return useQuery({
    queryKey: ['student-videos'],
    queryFn: studentService.getStudentVideos,
  });
};

export const useStudentMaterials = () => {
  return useQuery({
    queryKey: ['student-materials'],
    queryFn: studentService.getStudentMaterials,
  });
};
