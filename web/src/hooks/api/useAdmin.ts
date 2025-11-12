import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService, CreateStudentData, CreateCourseData, CreateBatchData, CreateStaffData } from '@/services/admin';
import { useToast } from '@/hooks/use-toast';

export const useStudents = (params: any = {}) => {
  return useQuery({
    queryKey: ['students', params],
    queryFn: () => adminService.getStudents(params),
  });
};

export const useCreateStudent = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStudentData) => adminService.createStudent(data),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Student created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
  description: error?.response?.data?.message || error.message || 'Failed to create student',
        variant: 'destructive',
      });
    },
  });
};

export const useCourses = (params: any = {}) => {
  return useQuery({
    queryKey: ['courses', params],
    queryFn: () => adminService.getCourses(params),
  });
};

export const useCreateCourse = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCourseData) => adminService.createCourse(data),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Course created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create course',
        variant: 'destructive',
      });
    },
  });
};

export const useBatches = (params: any = {}) => {
  return useQuery({
    queryKey: ['batches', params],
    queryFn: () => adminService.getBatches(params),
  });
};

export const useCreateBatch = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBatchData) => adminService.createBatch(data),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Batch created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['batches'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create batch',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateBatch = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateBatchData> }) => 
      adminService.updateBatch(id, data),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Batch updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['batches'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update batch',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteBatch = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminService.deleteBatch(id),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Batch deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['batches'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete batch',
        variant: 'destructive',
      });
    },
  });
};

export const useStaff = () => {
  return useQuery({
    queryKey: ['staff'],
    queryFn: adminService.getStaff,
  });
};

export const useCreateStaff = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStaffData) => adminService.createStaff(data),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Staff member created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create staff member',
        variant: 'destructive',
      });
    },
  });
};
