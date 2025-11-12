
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quizService, QuizQuery, QuizSubmission } from '@/services/quizzes';
import { useToast } from '@/hooks/use-toast';

export const useQuizzes = (params: QuizQuery = {}) => {
  return useQuery({
    queryKey: ['quizzes', params],
    queryFn: () => quizService.getQuizzes(params),
  });
};

export const useQuiz = (id: string) => {
  return useQuery({
    queryKey: ['quiz', id],
    queryFn: () => quizService.getQuizById(id),
    enabled: !!id,
  });
};

export const useSubmitQuiz = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (submission: QuizSubmission) => quizService.submitQuiz(submission),
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: 'Quiz submitted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['quiz-attempts'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit quiz',
        variant: 'destructive',
      });
    },
  });
};

export const useQuizAttempts = () => {
  return useQuery({
    queryKey: ['quiz-attempts'],
    queryFn: quizService.getQuizAttempts,
  });
};
