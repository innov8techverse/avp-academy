import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subjectService, CreateSubjectData, Subject } from '@/services/subject/subjectService';

export const useSubjects = (params: any = {}) => {
  return useQuery({ 
    queryKey: ['subjects', params], 
    queryFn: () => subjectService.getSubjects(params)
  });
};

export const useCreateSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: subjectService.createSubject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });
};

export const useUpdateSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: Partial<CreateSubjectData> }) => subjectService.updateSubject(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });
};

export const useDeleteSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: subjectService.deleteSubject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });
}; 