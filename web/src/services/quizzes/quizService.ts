
import { apiClient } from '../api';

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  subject: string;
  duration: number;
  totalQuestions: number;
  totalMarks: number;
  passingMarks: number;
  isPublished: boolean;
  createdAt: string;
}

export interface QuizAnswer {
  questionId: string;
  answer: string;
  timeTaken: number;
}

export interface QuizSubmission {
  quizId: string;
  answers: QuizAnswer[];
  totalTimeTaken: number;
}

export interface QuizQuery {
  page?: number;
  limit?: number;
  subject?: string;
  search?: string;
}

export const quizService = {
  getQuizzes: async (params: QuizQuery = {}) => {
    return await apiClient.get('/quizzes', { params });
  },

  getQuizById: async (id: string) => {
    return await apiClient.get(`/quizzes/${id}`);
  },

  submitQuiz: async (submission: QuizSubmission) => {
    return await apiClient.post('/quizzes/submit', submission);
  },

  getQuizAttempts: async () => {
    return await apiClient.get('/tests/student/history');
  }
};
