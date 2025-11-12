import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { questionBankService, QuestionQuery, CreateQuestionData, UpdateQuestionData } from '@/services/questionBank/questionBankService';

// Hook to get questions with filtering and pagination
export const useQuestions = (params: QuestionQuery = {}) => {
  return useQuery({
    queryKey: ['questions', params],
    queryFn: () => questionBankService.getQuestions(params),
    staleTime: 0, // Disable caching for debugging
    cacheTime: 0, // Disable cache time for debugging
  });
};

// Hook to get a specific question
export const useQuestion = (id: string) => {
  return useQuery({
    queryKey: ['question', id],
    queryFn: () => questionBankService.getQuestion(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to create a question
export const useCreateQuestion = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateQuestionData) => questionBankService.createQuestion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['all-questions'] });
      queryClient.invalidateQueries({ queryKey: ['questions-by-qp-code'] });
    },
  });
};

// Hook to update a question
export const useUpdateQuestion = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateQuestionData }) => 
      questionBankService.updateQuestion(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['question', id] });
      queryClient.invalidateQueries({ queryKey: ['all-questions'] });
      queryClient.invalidateQueries({ queryKey: ['questions-by-qp-code'] });
      queryClient.invalidateQueries({ queryKey: ['question-paper'] });
    },
  });
};

// Hook to delete a question
export const useDeleteQuestion = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => questionBankService.deleteQuestion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['all-questions'] });
      queryClient.invalidateQueries({ queryKey: ['questions-by-qp-code'] });
      queryClient.invalidateQueries({ queryKey: ['question-paper'] });
    },
  });
};

// Hook to get question count statistics
export const useQuestionsCount = (params: QuestionQuery = {}) => {
  return useQuery({
    queryKey: ['questions-count', params],
    queryFn: () => questionBankService.getQuestionsCount(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to bulk import questions
export const useBulkImportQuestions = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (questions: CreateQuestionData[]) => questionBankService.bulkImportQuestions(questions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['all-questions'] });
      queryClient.invalidateQueries({ queryKey: ['questions-by-qp-code'] });
    },
  });
};