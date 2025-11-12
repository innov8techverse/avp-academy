import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { qpCodeService, QPCodeQuery, CreateQPCodeData } from '@/services/qpCodes';

// Get QP Codes
export const useQPCodes = (params: QPCodeQuery = {}) => {
  return useQuery({
    queryKey: ['qp-codes', params],
    queryFn: async () => {
      const result = await qpCodeService.getQPCodes(params);
      return result;
    },
    staleTime: 0, // Disable caching for debugging
    cacheTime: 0, // Disable cache time for debugging
  });
};

// Get QP Code by ID
export const useQPCode = (id: string) => {
  return useQuery({
    queryKey: ['qp-codes', id],
    queryFn: () => qpCodeService.getQPCodeById(id),
    enabled: !!id
  });
};

// Create QP Code
export const useCreateQPCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateQPCodeData) => qpCodeService.createQPCode(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qp-codes'] });
    }
  });
};

// Update QP Code
export const useUpdateQPCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateQPCodeData> }) => 
      qpCodeService.updateQPCode(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qp-codes'] });
    }
  });
};

// Delete QP Code
export const useDeleteQPCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => qpCodeService.deleteQPCode(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qp-codes'] });
    }
  });
};
