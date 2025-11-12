import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { testService, CreateTestData } from '@/services/tests/testService';
import { useToast } from '@/hooks/use-toast';

export const useCreateTest = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTestData) => testService.createTest(data),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Test created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['tests'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create test',
        variant: 'destructive',
      });
    },
  });
};

export const useBatches = () => {
  return useQuery({
    queryKey: ['batches'],
    queryFn: async () => {
      // This would need to be implemented in the testService
      // For now, returning empty array
      return { data: [] };
    },
  });
};

export const useCourses = () => {
  return useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      // This would need to be implemented in the testService
      // For now, returning empty array
      return { data: [] };
    },
  });
};
