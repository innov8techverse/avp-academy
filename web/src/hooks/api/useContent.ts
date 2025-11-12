
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contentService } from '@/services/content';
import { useToast } from '@/hooks/use-toast';

export const useContent = (params: any = {}) => {
  return useQuery({
    queryKey: ['materials', params],
    queryFn: () => contentService.getStudyMaterials(params),
  });
};

export const useUploadMaterial = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => contentService.uploadStudyMaterial(formData),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Material uploaded successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload material',
        variant: 'destructive',
      });
    },
  });
};
