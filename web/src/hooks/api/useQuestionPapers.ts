import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { questionPaperService, QuestionPaperQuery, CreateQuestionPaperData, UpdateQuestionPaperData, AddQuestionsToPaperData } from '@/services/questionPapers';

// Hook to get question papers with filtering and pagination
export const useQuestionPapers = (params: QuestionPaperQuery = {}) => {
  return useQuery({
    queryKey: ['question-papers', params],
    queryFn: () => questionPaperService.getQuestionPapers(params),
    staleTime: 0, // Disable caching for debugging
    cacheTime: 0, // Disable cache time for debugging
  });
};

// Hook to get a specific question paper
export const useQuestionPaper = (id: string) => {
  return useQuery({
    queryKey: ['question-paper', id],
    queryFn: () => questionPaperService.getQuestionPaper(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to get question papers for dropdown
export const useQuestionPapersForDropdown = (params: { qp_code_id?: number } = {}) => {
  return useQuery({
    queryKey: ['question-papers-dropdown', params],
    queryFn: () => questionPaperService.getQuestionPapersForDropdown(params),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook to create a question paper
export const useCreateQuestionPaper = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateQuestionPaperData) => questionPaperService.createQuestionPaper(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-papers'] });
      queryClient.invalidateQueries({ queryKey: ['question-papers-dropdown'] });
    },
  });
};

// Hook to update a question paper
export const useUpdateQuestionPaper = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateQuestionPaperData }) => 
      questionPaperService.updateQuestionPaper(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['question-papers'] });
      queryClient.invalidateQueries({ queryKey: ['question-paper', id] });
      queryClient.invalidateQueries({ queryKey: ['question-papers-dropdown'] });
    },
  });
};

// Hook to delete a question paper
export const useDeleteQuestionPaper = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => questionPaperService.deleteQuestionPaper(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-papers'] });
      queryClient.invalidateQueries({ queryKey: ['question-papers-dropdown'] });
    },
  });
};

// Hook to add questions to a question paper
export const useAddQuestionsToPaper = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AddQuestionsToPaperData }) => 
      questionPaperService.addQuestionsToPaper(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['question-papers'] });
      queryClient.invalidateQueries({ queryKey: ['question-paper', id] });
      queryClient.invalidateQueries({ queryKey: ['question-paper-questions', id] }); // Fix: Invalidate questions list
    },
  });
};

// Hook to remove a question from a question paper
export const useRemoveQuestionFromPaper = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ paperId, questionId }: { paperId: string; questionId: string }) => 
      questionPaperService.removeQuestionFromPaper(paperId, questionId),
    onSuccess: (_, { paperId }) => {
      queryClient.invalidateQueries({ queryKey: ['question-papers'] });
      queryClient.invalidateQueries({ queryKey: ['question-paper', paperId] });
      queryClient.invalidateQueries({ queryKey: ['question-paper-questions', paperId] }); // Fix: Invalidate questions list
    },
  });
};

// Hook to get questions by QP Code
export const useQuestionsByQPCode = (qpCodeId: string, params: { page?: number; limit?: number; search?: string; type?: string; difficulty?: string } = {}) => {
  return useQuery({
    queryKey: ['questions-by-qp-code', qpCodeId, params],
    queryFn: async () => {
      const result = await questionPaperService.getQuestionsByQPCode(qpCodeId, params);
      return result;
    },
    enabled: !!qpCodeId,
    staleTime: 0, // Disable caching for debugging
    cacheTime: 0, // Disable cache time for debugging
  });
};

// Hook to get questions for a specific question paper (only questions linked to that paper)
export const useQuestionPaperQuestions = (paperId: string, params: { page?: number; limit?: number } = {}) => {
  return useQuery({
    queryKey: ['question-paper-questions', paperId, params],
    queryFn: async () => {
      const result = await questionPaperService.getQuestionPaperQuestions(paperId, params);
      return result;
    },
    enabled: !!paperId && paperId !== 'all',
    staleTime: 0, // Disable caching for debugging
    cacheTime: 0, // Disable cache time for debugging
  });
};

// Hook to get all questions (for Question Bank)
export const useAllQuestions = (params: { page?: number; limit?: number; search?: string; type?: string; difficulty?: string; qp_code_id?: string } = {}) => {
  return useQuery({
    queryKey: ['all-questions', params],
    queryFn: async () => {
      const result = await questionPaperService.getAllQuestions(params);
      return result;
    },
    staleTime: 0, // Disable caching for debugging
    cacheTime: 0, // Disable cache time for debugging
  });
};

// Hook to import questions from CSV
export const useImportQuestionsFromCSV = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ paperId, questions }: { paperId: string; questions: any[] }) => 
      questionPaperService.importQuestionsFromCSV(paperId, questions),
    onSuccess: (_, { paperId }) => {
      queryClient.invalidateQueries({ queryKey: ['question-papers'] });
      queryClient.invalidateQueries({ queryKey: ['question-paper', paperId] });
      queryClient.invalidateQueries({ queryKey: ['question-paper-questions', paperId] }); // Fix: Invalidate questions list
    },
  });
};

// Hook to get QP Code usage history
export const useQPCodeUsageHistory = (qpCodeId: string, params: { page?: number; limit?: number } = {}) => {
  return useQuery({
    queryKey: ['qp-code-usage-history', qpCodeId, params],
    queryFn: () => questionPaperService.getQPCodeUsageHistory(qpCodeId, params),
    enabled: !!qpCodeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
